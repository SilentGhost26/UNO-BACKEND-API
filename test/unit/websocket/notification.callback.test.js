const createNotificationCallbacks = require('../../../src/websocket/callbacks/notification.callback');
const createInvitationRegistry = require('../../../src/registry/invitation.registry');
const sendInvitationSchema = require('../../../src/schemas/send-invitation.schema');
const invitationResponseSchema = require('../../../src/schemas/invitation-response.schema');
const { gameService, gamePlayerService, playerService } = require('../utils/services-mocks.utils');

const TTL = 60 * 1000;

const createSocket = (playerId) => ({
    player: { id: playerId },
    join: jest.fn(),
    emit: jest.fn(),
});

// Records every emit together with the room it was sent to
const createIo = () => {
    const emitted = [];
    return {
        emitted,
        to: (room) => ({ emit: (event, data) => emitted.push({ room, event, data }) }),
    };
};

const wrapError = (socket, handler) => async (data) => {
    try {
        await handler(data);
    } catch (error) {
        socket.emit('error', {
            message: error.message || 'internal server error',
            statusCode: error.statusCode || 500,
            details: error.details || [],
        });
    }
};

const errorOf = (socket) => socket.emit.mock.calls.find(([event]) => event === 'error')?.[1];

let clock;
let io;
let invitationRegistry;
let playerRegistry;
let sender;
let receiver;
let receiverSecondTab;
let senderSocket;
let receiverSocket;
let receiverSecondTabSocket;

const build = (socket) => {
    const callbacks = createNotificationCallbacks(
        io, socket, wrapError, playerRegistry, playerService, gameService, gamePlayerService, invitationRegistry,
    );
    return {
        send: (payload) => callbacks.sendInvitation(sendInvitationSchema)(payload),
        accept: (payload) => callbacks.acceptInvitation(invitationResponseSchema)(payload),
        reject: (payload) => callbacks.rejectInvitation(invitationResponseSchema)(payload),
    };
};

const invite = async () => {
    await sender.send({ playerId: 'player-2', gameId: 'game-1' });
    const sent = io.emitted.filter(e => e.event === 'invitation-sent');
    return sent[sent.length - 1].data.invitationId;
};

describe('tests for notification callbacks', () => {
    beforeEach(() => {
        clock = { time: 1_000_000 };
        io = createIo();
        invitationRegistry = createInvitationRegistry({ ttlMs: TTL, now: () => clock.time });
        playerRegistry = { isOnline: jest.fn().mockReturnValue(true) };

        senderSocket = createSocket('player-1');
        receiverSocket = createSocket('player-2');
        receiverSecondTabSocket = createSocket('player-2');
        sender = build(senderSocket);
        receiver = build(receiverSocket);
        receiverSecondTab = build(receiverSecondTabSocket);

        gameService.findGameById.mockResolvedValue({
            ok: true,
            result: { id: 'game-1', title: 'Mesa 1', status: 'WAITING', maxPlayers: 4 },
        });
        gamePlayerService.getPlayersByGameId.mockResolvedValue({
            ok: true,
            result: [{ id: 1, playerId: 'player-1', name: 'Ana' }],
        });
        playerService.findPlayerById.mockResolvedValue({ ok: true, result: { id: 'player-1', name: 'Ana' } });
        gamePlayerService.addGamePlayer.mockResolvedValue({ ok: true, result: { playerId: 'player-2', gameId: 'game-1' } });
    });

    describe('sendInvitation', () => {
        test('send the invitation to the personal room of the invited player', async () => {
            await sender.send({ playerId: 'player-2', gameId: 'game-1' });

            expect(io.emitted).toHaveLength(1);
            expect(io.emitted[0]).toEqual({
                room: 'player:player-2',
                event: 'invitation-sent',
                data: {
                    invitationId: expect.any(String),
                    expiresAt: clock.time + TTL,
                    sender: { id: 'player-1', name: 'Ana' },
                    game: { id: 'game-1', title: 'Mesa 1' },
                },
            });
            expect(senderSocket.emit).not.toHaveBeenCalled();
        });

        test('emit a 400 when the payload is not valid', async () => {
            await sender.send({ playerId: 'player-2' });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ message: 'Validation failed', statusCode: 400 }));
            expect(io.emitted).toHaveLength(0);
        });

        test('emit a 400 when the client sends no payload', async () => {
            await sender.send(undefined);

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ message: 'Validation failed', statusCode: 400 }));
        });

        test('emit a 400 when the player invites himself', async () => {
            await sender.send({ playerId: 'player-1', gameId: 'game-1' });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ statusCode: 400, message: 'you cannot invite yourself' }));
        });

        test('emit a 404 when the invited player is not online', async () => {
            playerRegistry.isOnline.mockReturnValue(false);

            await sender.send({ playerId: 'player-2', gameId: 'game-1' });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ statusCode: 404, message: 'player is not online' }));
            expect(io.emitted).toHaveLength(0);
        });

        test('emit the error of the service when the game does not exist', async () => {
            const error = new Error('game not found');
            error.statusCode = 404;
            gameService.findGameById.mockResolvedValue({ ok: false, error });

            await sender.send({ playerId: 'player-2', gameId: 'game-1' });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ statusCode: 404, message: 'game not found' }));
        });

        test('emit a 409 when the game already started', async () => {
            gameService.findGameById.mockResolvedValue({
                ok: true,
                result: { id: 'game-1', title: 'Mesa 1', status: 'PLAYING', maxPlayers: 4 },
            });

            await sender.send({ playerId: 'player-2', gameId: 'game-1' });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ statusCode: 409 }));
            expect(io.emitted).toHaveLength(0);
        });

        test('emit a 403 when the sender is not part of the game', async () => {
            gamePlayerService.getPlayersByGameId.mockResolvedValue({
                ok: true,
                result: [{ id: 1, playerId: 'player-9', name: 'Otro' }],
            });

            await sender.send({ playerId: 'player-2', gameId: 'game-1' });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ statusCode: 403 }));
            expect(io.emitted).toHaveLength(0);
        });

        test('emit a 409 when the invited player is already in the game', async () => {
            gamePlayerService.getPlayersByGameId.mockResolvedValue({
                ok: true,
                result: [
                    { id: 1, playerId: 'player-1', name: 'Ana' },
                    { id: 2, playerId: 'player-2', name: 'Luis' },
                ],
            });

            await sender.send({ playerId: 'player-2', gameId: 'game-1' });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ statusCode: 409 }));
        });

        test('emit a 409 when the game is full', async () => {
            gameService.findGameById.mockResolvedValue({
                ok: true,
                result: { id: 'game-1', title: 'Mesa 1', status: 'WAITING', maxPlayers: 1 },
            });

            await sender.send({ playerId: 'player-2', gameId: 'game-1' });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ statusCode: 409 }));
            expect(io.emitted).toHaveLength(0);
        });

        test('emit a 409 when the player already has a pending invitation for the game', async () => {
            await invite();
            senderSocket.emit.mockClear();

            await sender.send({ playerId: 'player-2', gameId: 'game-1' });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({
                statusCode: 409,
                message: 'player already has a pending invitation for this game',
            }));
            expect(io.emitted).toHaveLength(1);
        });
    });

    describe('acceptInvitation', () => {
        test('add the player to the game and notify the game, the sender and every tab of the receiver', async () => {
            const invitationId = await invite();

            await receiver.accept({ invitationId });

            expect(gamePlayerService.addGamePlayer).toHaveBeenCalledWith({ playerId: 'player-2', gameId: 'game-1' });
            expect(receiverSocket.join).toHaveBeenCalledWith('game-1');
            expect(receiverSocket.emit).not.toHaveBeenCalled();
            expect(io.emitted).toEqual(expect.arrayContaining([
                { room: 'game-1', event: 'player-joined', data: { playerId: 'player-2', gameId: 'game-1' } },
                { room: 'player:player-1', event: 'invitation-accepted', data: { invitationId, gameId: 'game-1', playerId: 'player-2' } },
                { room: 'player:player-2', event: 'invitation-resolved', data: { invitationId, status: 'ACCEPTED' } },
            ]));
        });

        test('emit a 409 when the same invitation is accepted twice and add the player only once', async () => {
            const invitationId = await invite();
            await receiver.accept({ invitationId });

            await receiverSecondTab.accept({ invitationId });

            expect(errorOf(receiverSecondTabSocket)).toEqual(expect.objectContaining({
                statusCode: 409,
                message: 'invitation already accepted',
            }));
            expect(gamePlayerService.addGamePlayer).toHaveBeenCalledTimes(1);
            expect(receiverSecondTabSocket.join).not.toHaveBeenCalled();
        });

        test('let only one of two simultaneous accepts through', async () => {
            const invitationId = await invite();
            let finishAdding;
            gamePlayerService.addGamePlayer.mockImplementation(() => new Promise(resolve => {
                finishAdding = () => resolve({ ok: true, result: { playerId: 'player-2', gameId: 'game-1' } });
            }));

            const first = receiver.accept({ invitationId });
            const second = receiverSecondTab.accept({ invitationId });
            await second;
            finishAdding();
            await first;

            expect(gamePlayerService.addGamePlayer).toHaveBeenCalledTimes(1);
            expect(errorOf(receiverSecondTabSocket)).toEqual(expect.objectContaining({
                statusCode: 409,
                message: 'invitation is already being processed',
            }));
            expect(errorOf(receiverSocket)).toBeUndefined();
            expect(io.emitted.filter(e => e.event === 'player-joined')).toHaveLength(1);
        });

        test('emit a 409 when the invitation was rejected before', async () => {
            const invitationId = await invite();
            await receiver.reject({ invitationId });

            await receiverSecondTab.accept({ invitationId });

            expect(errorOf(receiverSecondTabSocket)).toEqual(expect.objectContaining({
                statusCode: 409,
                message: 'invitation already rejected',
            }));
            expect(gamePlayerService.addGamePlayer).not.toHaveBeenCalled();
        });

        test('emit a 404 when a player that was not invited tries to accept', async () => {
            const invitationId = await invite();

            await sender.accept({ invitationId });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ statusCode: 404 }));
            expect(gamePlayerService.addGamePlayer).not.toHaveBeenCalled();
        });

        test('emit a 404 when the invitation does not exist', async () => {
            await receiver.accept({ invitationId: '6f1c6ad3-7b5e-4c1a-9a55-0d7f1a2b3c4d' });

            expect(errorOf(receiverSocket)).toEqual(expect.objectContaining({ statusCode: 404 }));
        });

        test('emit a 410 when the invitation expired', async () => {
            const invitationId = await invite();
            clock.time += TTL;

            await receiver.accept({ invitationId });

            expect(errorOf(receiverSocket)).toEqual(expect.objectContaining({ statusCode: 410, message: 'invitation expired' }));
            expect(gamePlayerService.addGamePlayer).not.toHaveBeenCalled();
        });

        test('emit a 400 when the old payload with gameId is used', async () => {
            await invite();

            await receiver.accept({ gameId: 'game-1' });

            expect(errorOf(receiverSocket)).toEqual(expect.objectContaining({ statusCode: 400, message: 'Validation failed' }));
            expect(gamePlayerService.addGamePlayer).not.toHaveBeenCalled();
        });

        test('close the invitation for good when the game can not accept the player anymore', async () => {
            const invitationId = await invite();
            const error = new Error('Game with ID game-1 is not in waiting state');
            error.statusCode = 409;
            gamePlayerService.addGamePlayer.mockResolvedValue({ ok: false, error });

            await receiver.accept({ invitationId });

            expect(errorOf(receiverSocket)).toEqual(expect.objectContaining({ statusCode: 409 }));
            expect(receiverSocket.join).not.toHaveBeenCalled();
            expect(io.emitted).toContainEqual({ room: 'player:player-2', event: 'invitation-resolved', data: { invitationId, status: 'FAILED' } });

            await receiverSecondTab.accept({ invitationId });
            expect(errorOf(receiverSecondTabSocket)).toEqual(expect.objectContaining({ message: 'invitation already failed' }));
        });

        test('let the player try again when addGamePlayer fails with a non permanent error', async () => {
            const invitationId = await invite();
            const error = new Error('database unavailable');
            error.statusCode = 500;
            gamePlayerService.addGamePlayer.mockResolvedValueOnce({ ok: false, error });

            await receiver.accept({ invitationId });
            expect(errorOf(receiverSocket)).toEqual(expect.objectContaining({ statusCode: 500 }));

            await receiverSecondTab.accept({ invitationId });
            expect(errorOf(receiverSecondTabSocket)).toBeUndefined();
            expect(io.emitted).toContainEqual({ room: 'player:player-2', event: 'invitation-resolved', data: { invitationId, status: 'ACCEPTED' } });
        });

        test('let the player try again when addGamePlayer throws', async () => {
            const invitationId = await invite();
            gamePlayerService.addGamePlayer.mockRejectedValueOnce(new Error('connection lost'));

            await receiver.accept({ invitationId });
            expect(errorOf(receiverSocket)).toEqual(expect.objectContaining({ statusCode: 500, message: 'connection lost' }));

            await receiverSecondTab.accept({ invitationId });
            expect(errorOf(receiverSecondTabSocket)).toBeUndefined();
        });
    });

    describe('rejectInvitation', () => {
        test('notify the sender and every tab of the receiver', async () => {
            const invitationId = await invite();

            await receiver.reject({ invitationId });

            expect(receiverSocket.emit).not.toHaveBeenCalled();
            expect(io.emitted).toEqual(expect.arrayContaining([
                { room: 'player:player-1', event: 'invitation-rejected', data: { invitationId, gameId: 'game-1', playerId: 'player-2' } },
                { room: 'player:player-2', event: 'invitation-resolved', data: { invitationId, status: 'REJECTED' } },
            ]));
        });

        test('emit a 409 when the same invitation is rejected twice and notify the sender only once', async () => {
            const invitationId = await invite();
            await receiver.reject({ invitationId });

            await receiverSecondTab.reject({ invitationId });

            expect(errorOf(receiverSecondTabSocket)).toEqual(expect.objectContaining({
                statusCode: 409,
                message: 'invitation already rejected',
            }));
            expect(io.emitted.filter(e => e.event === 'invitation-rejected')).toHaveLength(1);
        });

        test('emit a 409 when the invitation was accepted before', async () => {
            const invitationId = await invite();
            await receiver.accept({ invitationId });

            await receiverSecondTab.reject({ invitationId });

            expect(errorOf(receiverSecondTabSocket)).toEqual(expect.objectContaining({
                statusCode: 409,
                message: 'invitation already accepted',
            }));
        });

        test('emit a 404 when a player that was not invited tries to reject', async () => {
            const invitationId = await invite();

            await sender.reject({ invitationId });

            expect(errorOf(senderSocket)).toEqual(expect.objectContaining({ statusCode: 404 }));
            expect(io.emitted.filter(e => e.event === 'invitation-rejected')).toHaveLength(0);
        });

        test('emit a 400 when the invitationId is not a valid id', async () => {
            await receiver.reject({ invitationId: 'not-an-id' });

            expect(errorOf(receiverSocket)).toEqual(expect.objectContaining({ statusCode: 400, message: 'Validation failed' }));
        });

        test('let the sender invite again after the rejection', async () => {
            const invitationId = await invite();
            await receiver.reject({ invitationId });

            const second = await invite();

            expect(second).not.toBe(invitationId);
        });
    });
});
