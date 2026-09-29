const { randomUUID } = require('crypto');
const { ok, err } = require('../helpers/result.helper');

const DEFAULT_TTL_MS = 60 * 1000;
const DEFAULT_RETENTION_MS = 5 * 60 * 1000;
const FINAL_STATUSES = ['ACCEPTED', 'REJECTED', 'FAILED'];

const fail = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return err(error);
};

/**
 * Factory to create an invitation registry
 * @param ttlMs : time in milliseconds that an invitation can be answered
 * @param retentionMs : time in milliseconds that an answered invitation is remembered
 * (this is what allows to answer "already accepted" instead of "not found")
 * @param now : function that returns the current time (injectable to test)
 * @param generateId : function that returns a new id (injectable to test)
 * @returns a literal object with the functions of the registry
 */
const createInvitationRegistry = ({
    ttlMs = DEFAULT_TTL_MS,
    retentionMs = DEFAULT_RETENTION_MS,
    now = Date.now,
    generateId = randomUUID,
} = {}) => {
    const invitations = new Map();  // id -> invitation
    const activeByKey = new Map();  // `${gameId}:${receiverId}` -> id of the PENDING or PROCESSING invitation

    const keyOf = ({ gameId, receiverId }) => `${gameId}:${receiverId}`;
    const snapshot = (invitation) => ({ ...invitation });

    const finish = (invitation, status) => {
        invitation.status = status;
        if (activeByKey.get(keyOf(invitation)) === invitation.id) {
            activeByKey.delete(keyOf(invitation));
        }
    };

    const isExpired = (invitation) => invitation.status === 'PENDING' && invitation.expiresAt <= now();

    const sweep = () => {
        const limit = now() - retentionMs;
        for (const [id, invitation] of invitations) {
            if (isExpired(invitation)) {
                finish(invitation, 'EXPIRED');
            }
            const isActive = invitation.status === 'PENDING' || invitation.status === 'PROCESSING';
            if (!isActive && invitation.expiresAt < limit) {
                invitations.delete(id);
            }
        }
    };

    /**
     * Create a pending invitation
     * @returns ok with the invitation. err 409 if the receiver already has an active invitation for that game
     */
    const create = ({ gameId, senderId, receiverId }) => {
        sweep();
        if (activeByKey.has(keyOf({ gameId, receiverId }))) {
            return fail(409, 'player already has a pending invitation for this game');
        }

        const timestamp = now();
        const invitation = {
            id: generateId(),
            gameId,
            senderId,
            receiverId,
            status: 'PENDING',
            createdAt: timestamp,
            expiresAt: timestamp + ttlMs,
        };
        invitations.set(invitation.id, invitation);
        activeByKey.set(keyOf(invitation), invitation.id);
        return ok(snapshot(invitation));
    };

    /**
     * Take the invitation to answer it. Only the receiver can do it and only once.
     * The caller must finish with settle() or release().
     * @returns ok with the invitation (PROCESSING). err 404 / 409 / 410
     */
    const claim = (id, receiverId) => {
        const invitation = invitations.get(id);
        if (!invitation || invitation.receiverId !== receiverId) {
            return fail(404, 'invitation not found');
        }
        if (invitation.status === 'PROCESSING') {
            return fail(409, 'invitation is already being processed');
        }
        if (isExpired(invitation)) {
            finish(invitation, 'EXPIRED');
        }
        if (invitation.status === 'EXPIRED') {
            return fail(410, 'invitation expired');
        }
        if (invitation.status !== 'PENDING') {
            return fail(409, `invitation already ${invitation.status.toLowerCase()}`);
        }

        invitation.status = 'PROCESSING';
        return ok(snapshot(invitation));
    };

    /**
     * Finish the answer of a claimed invitation
     * @param status : ACCEPTED, REJECTED or FAILED
     */
    const settle = (id, status) => {
        if (!FINAL_STATUSES.includes(status)) {
            return fail(400, `invalid final status: ${status}`);
        }
        const invitation = invitations.get(id);
        if (!invitation || invitation.status !== 'PROCESSING') {
            return fail(409, 'invitation is not being processed');
        }
        finish(invitation, status);
        return ok(snapshot(invitation));
    };

    /**
     * Give back a claimed invitation, so the receiver can try again (when it did not expire)
     */
    const release = (id) => {
        const invitation = invitations.get(id);
        if (!invitation || invitation.status !== 'PROCESSING') {
            return fail(409, 'invitation is not being processed');
        }
        invitation.status = 'PENDING';
        if (isExpired(invitation)) {
            finish(invitation, 'EXPIRED');
        }
        return ok(snapshot(invitation));
    };

    const getById = (id) => {
        const invitation = invitations.get(id);
        return invitation ? snapshot(invitation) : null;
    };

    return { create, claim, settle, release, getById };
}

module.exports = createInvitationRegistry;
