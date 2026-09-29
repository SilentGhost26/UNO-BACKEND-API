const createInvitationRegistry = require('../../../src/registry/invitation.registry');

const TTL = 60 * 1000;
const RETENTION = 5 * 60 * 1000;
const data = { gameId: 'game-1', senderId: 'player-1', receiverId: 'player-2' };

let clock;
let counter;
let registry;

const createInvitation = (overrides = {}) => {
    const created = registry.create({ ...data, ...overrides });
    expect(created.ok).toBe(true);
    return created.result;
};

describe('tests for invitation registry', () => {
    beforeEach(() => {
        clock = { time: 1_000_000 };
        counter = 0;
        registry = createInvitationRegistry({
            ttlMs: TTL,
            retentionMs: RETENTION,
            now: () => clock.time,
            generateId: () => `invitation-${++counter}`,
        });
    });

    describe('create', () => {
        test('create a pending invitation that expires after the ttl', () => {
            const result = registry.create(data);

            expect(result.ok).toBe(true);
            expect(result.result).toEqual({
                id: 'invitation-1',
                ...data,
                status: 'PENDING',
                createdAt: clock.time,
                expiresAt: clock.time + TTL,
            });
        });

        test('return a 409 when the player already has a pending invitation for the game', () => {
            createInvitation();

            const result = registry.create(data);

            expect(result.ok).toBe(false);
            expect(result.error.statusCode).toBe(409);
            expect(result.error.message).toBe('player already has a pending invitation for this game');
        });

        test('do not allow a second invitation while the first one is being processed', () => {
            const invitation = createInvitation();
            registry.claim(invitation.id, data.receiverId);

            expect(registry.create(data).ok).toBe(false);
        });

        test('allow the same player to be invited to another game', () => {
            createInvitation();
            expect(registry.create({ ...data, gameId: 'game-2' }).ok).toBe(true);
        });

        test('allow another player to be invited to the same game', () => {
            createInvitation();
            expect(registry.create({ ...data, receiverId: 'player-3' }).ok).toBe(true);
        });

        test('allow a new invitation when the previous one expired', () => {
            createInvitation();
            clock.time += TTL;

            expect(registry.create(data).ok).toBe(true);
        });

        test('allow a new invitation when the previous one was rejected', () => {
            const invitation = createInvitation();
            registry.claim(invitation.id, data.receiverId);
            registry.settle(invitation.id, 'REJECTED');

            expect(registry.create(data).ok).toBe(true);
        });

        test('forget the answered invitations after the retention time', () => {
            const invitation = createInvitation();
            registry.claim(invitation.id, data.receiverId);
            registry.settle(invitation.id, 'ACCEPTED');
            expect(registry.getById(invitation.id)).not.toBeNull();

            clock.time += TTL + RETENTION + 1;
            registry.create({ ...data, receiverId: 'player-3' });

            expect(registry.getById(invitation.id)).toBeNull();
        });
    });

    describe('claim', () => {
        test('move the invitation to processing', () => {
            const invitation = createInvitation();

            const result = registry.claim(invitation.id, data.receiverId);

            expect(result.ok).toBe(true);
            expect(result.result.status).toBe('PROCESSING');
        });

        test('return a 409 to the second claim of the same invitation', () => {
            const invitation = createInvitation();
            registry.claim(invitation.id, data.receiverId);

            const result = registry.claim(invitation.id, data.receiverId);

            expect(result.ok).toBe(false);
            expect(result.error.statusCode).toBe(409);
            expect(result.error.message).toBe('invitation is already being processed');
        });

        test('return a 404 when the invitation does not exist', () => {
            const result = registry.claim('unknown', data.receiverId);

            expect(result.ok).toBe(false);
            expect(result.error.statusCode).toBe(404);
        });

        test('return a 404 when another player tries to answer and keep the invitation pending', () => {
            const invitation = createInvitation();

            const result = registry.claim(invitation.id, 'player-3');

            expect(result.ok).toBe(false);
            expect(result.error.statusCode).toBe(404);
            expect(registry.getById(invitation.id).status).toBe('PENDING');
        });

        test('return a 410 when the invitation expired', () => {
            const invitation = createInvitation();
            clock.time += TTL;

            const result = registry.claim(invitation.id, data.receiverId);

            expect(result.ok).toBe(false);
            expect(result.error.statusCode).toBe(410);
            expect(result.error.message).toBe('invitation expired');
        });

        test('keep returning 410 after the expiration was detected', () => {
            const invitation = createInvitation();
            clock.time += TTL;
            registry.claim(invitation.id, data.receiverId);

            expect(registry.claim(invitation.id, data.receiverId).error.statusCode).toBe(410);
        });

        test('return a 409 saying the final status when it was already answered', () => {
            const accepted = createInvitation();
            registry.claim(accepted.id, data.receiverId);
            registry.settle(accepted.id, 'ACCEPTED');

            const rejected = createInvitation();
            registry.claim(rejected.id, data.receiverId);
            registry.settle(rejected.id, 'REJECTED');

            expect(registry.claim(accepted.id, data.receiverId).error.message).toBe('invitation already accepted');
            expect(registry.claim(rejected.id, data.receiverId).error.message).toBe('invitation already rejected');
        });
    });

    describe('settle', () => {
        test('finish a claimed invitation with the given status', () => {
            const invitation = createInvitation();
            registry.claim(invitation.id, data.receiverId);

            const result = registry.settle(invitation.id, 'ACCEPTED');

            expect(result.ok).toBe(true);
            expect(result.result.status).toBe('ACCEPTED');
        });

        test('do not expire an invitation that is being processed', () => {
            const invitation = createInvitation();
            registry.claim(invitation.id, data.receiverId);
            clock.time += TTL * 2;

            expect(registry.settle(invitation.id, 'ACCEPTED').ok).toBe(true);
        });

        test('return a 409 when the invitation was not claimed', () => {
            const invitation = createInvitation();

            const result = registry.settle(invitation.id, 'ACCEPTED');

            expect(result.ok).toBe(false);
            expect(result.error.statusCode).toBe(409);
        });

        test('return a 400 when the status is not a final status', () => {
            const invitation = createInvitation();
            registry.claim(invitation.id, data.receiverId);

            const result = registry.settle(invitation.id, 'PENDING');

            expect(result.ok).toBe(false);
            expect(result.error.statusCode).toBe(400);
        });
    });

    describe('release', () => {
        test('give the invitation back so it can be claimed again', () => {
            const invitation = createInvitation();
            registry.claim(invitation.id, data.receiverId);

            const released = registry.release(invitation.id);

            expect(released.ok).toBe(true);
            expect(released.result.status).toBe('PENDING');
            expect(registry.claim(invitation.id, data.receiverId).ok).toBe(true);
        });

        test('expire the invitation when the time ran out while it was processing', () => {
            const invitation = createInvitation();
            registry.claim(invitation.id, data.receiverId);
            clock.time += TTL;

            const released = registry.release(invitation.id);

            expect(released.result.status).toBe('EXPIRED');
            expect(registry.claim(invitation.id, data.receiverId).error.statusCode).toBe(410);
        });

        test('return a 409 when the invitation was not claimed', () => {
            const invitation = createInvitation();

            expect(registry.release(invitation.id).ok).toBe(false);
        });
    });

    describe('getById', () => {
        test('return a copy, so the state can not be changed from outside', () => {
            const invitation = createInvitation();

            const copy = registry.getById(invitation.id);
            copy.status = 'ACCEPTED';

            expect(registry.getById(invitation.id).status).toBe('PENDING');
        });

        test('return null when the invitation does not exist', () => {
            expect(registry.getById('unknown')).toBeNull();
        });
    });
});
