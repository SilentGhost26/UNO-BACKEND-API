let playerRegistry = require('../../../src/registry/player.registry');


describe('tests for player registry', () => {
    beforeEach(() => {
        playerRegistry = require('../../../src/registry/player.registry');
    });

    describe('tests for add connection', () => {
        test('add a first connection succesfully', () => {
            const playerId = 'player-1';
            const socketId = 'socket-1';

            const result = playerRegistry.addConnection(playerId, socketId);

            expect(result).toBe(true);
        });
    });

    describe('tests for remove connection', () => {
        test('remove a connection succesfully when is unique', () => {
            const playerId = 'player-1';
            const socketId = 'socket-1';

            playerRegistry.addConnection(playerId, socketId);
            const result = playerRegistry.removeConnection(playerId, socketId);

            expect(result).toBe(true);
        });

        test('remove a connection succesfully when there are more than 1', () => {
            const playerId = 'player-1';
            const socketId = 'socket-1';
            const socket2 = 'socket-2';

            playerRegistry.addConnection(playerId, socketId);
            playerRegistry.addConnection(playerId, socket2);
            const result = playerRegistry.removeConnection(playerId, socket2);

            expect(result).toBe(false);
        });

        test('return false when there are no connections with a specific playerId', () => {
            const playerId = 'player-2';
            const socketId = 'socket-1';

            const result = playerRegistry.removeConnection(playerId, socketId);

            expect(result).toBe(false);
        });
    });

    describe('tests for get online players', () => {
        test('get a list of socket id of a specific player', () => {
            const playerId = 'player-1';
            const socketId = 'socket-1';
            const socket2 = 'socket-2';

            playerRegistry.addConnection(playerId, socketId);
            playerRegistry.addConnection(playerId, socket2);

            const connections = playerRegistry.getConnections(playerId);
            
            expect(connections.length).toBe(2);
            expect(connections[0]).toBe(socketId);
        });
    });
});