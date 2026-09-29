const roomHandler = require('../handlers/room.handler');

/**
 * Factory to create the callbacks of the invitation events
 */
const createNotificationCallbacks = (
    io,
    socket,
    wrapError,
    playerRegistry,
    playerService,
    gameService,
    gamePlayerService,
    invitationRegistry,
) => {
    const sendInvitation = (sendInvitationSchema) => wrapError(socket, async (data) => {
        validateSchema(sendInvitationSchema, data);
        const senderId = socket.player.id;
        const { playerId: receiverId, gameId } = data;

        if (receiverId === senderId) {
            throw createError(400, 'you cannot invite yourself');
        }
        if (!playerRegistry.isOnline(receiverId)) {
            throw createError(404, 'player is not online');
        }

        const game = await gameService.findGameById(gameId);
        if (!game.ok) {
            throw game.error;
        }
        if (game.result.status !== 'WAITING') {
            throw createError(409, `game with ID ${gameId} is not in waiting state`);
        }

        const players = await gamePlayerService.getPlayersByGameId(gameId);
        if (!players.ok) {
            throw players.error;
        }
        if (!players.result.some(p => p.playerId === senderId)) {
            throw createError(403, 'only the players of the game can send invitations');
        }
        if (players.result.some(p => p.playerId === receiverId)) {
            throw createError(409, `player with ID ${receiverId} is already in the game`);
        }
        if (players.result.length >= game.result.maxPlayers) {
            throw createError(409, `The game with ID ${gameId} is full`);
        }

        const sender = await playerService.findPlayerById(senderId);
        if (!sender.ok) {
            throw sender.error;
        }

        const created = invitationRegistry.create({ gameId, senderId, receiverId });
        if (!created.ok) {
            throw created.error;
        }
        const invitation = created.result;

        roomHandler.broadcast(io, roomHandler.playerRoom(receiverId), 'invitation-sent', {
            invitationId: invitation.id,
            expiresAt: invitation.expiresAt,
            sender: { id: sender.result.id, name: sender.result.name },
            game: { id: game.result.id, title: game.result.title },
        });
    });

    const acceptInvitation = (invitationResponseSchema) => wrapError(socket, async (data) => {
        validateSchema(invitationResponseSchema, data);
        const playerId = socket.player.id;

        const claimed = invitationRegistry.claim(data.invitationId, playerId);
        if (!claimed.ok) {
            throw claimed.error;
        }
        const invitation = claimed.result;

        let added;
        try {
            added = await gamePlayerService.addGamePlayer({ playerId, gameId: invitation.gameId });
        } catch (error) {
            invitationRegistry.release(invitation.id);
            throw error;
        }

        if (!added.ok) {
            const isPermanent = added.error.statusCode === 404 || added.error.statusCode === 409;
            if (isPermanent) {
                invitationRegistry.settle(invitation.id, 'FAILED');
                notifyResolved(playerId, invitation.id, 'FAILED');
            } else {
                invitationRegistry.release(invitation.id);
            }
            throw added.error;
        }

        invitationRegistry.settle(invitation.id, 'ACCEPTED');
        roomHandler.joinRoom(socket, invitation.gameId);
        roomHandler.broadcast(io, invitation.gameId, 'player-joined', added.result);
        roomHandler.broadcast(io, roomHandler.playerRoom(invitation.senderId), 'invitation-accepted', {
            invitationId: invitation.id,
            gameId: invitation.gameId,
            playerId,
        });
        notifyResolved(playerId, invitation.id, 'ACCEPTED');
    });

    const rejectInvitation = (invitationResponseSchema) => wrapError(socket, async (data) => {
        validateSchema(invitationResponseSchema, data);
        const playerId = socket.player.id;

        const claimed = invitationRegistry.claim(data.invitationId, playerId);
        if (!claimed.ok) {
            throw claimed.error;
        }
        const invitation = claimed.result;

        invitationRegistry.settle(invitation.id, 'REJECTED');
        roomHandler.broadcast(io, roomHandler.playerRoom(invitation.senderId), 'invitation-rejected', {
            invitationId: invitation.id,
            gameId: invitation.gameId,
            playerId,
        });
        notifyResolved(playerId, invitation.id, 'REJECTED');
    });

    function notifyResolved(receiverId, invitationId, status) {
        roomHandler.broadcast(io, roomHandler.playerRoom(receiverId), 'invitation-resolved', { invitationId, status });
    }

    function createError(statusCode, message) {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
    }

    function validateSchema(schema, body) {
        const { error } = schema.validate(body === undefined ? null : body, { abortEarly: false });
        if (error) {
            const newError = new Error('Validation failed');
            newError.statusCode = 400;
            newError.details = error.details.map((e) => e.message);
            throw newError;
        }
    }

    return { sendInvitation, rejectInvitation, acceptInvitation };
}

module.exports = createNotificationCallbacks;
