const { gameEngineService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const createGameEngineController = require('../../../src/controllers/game-engine.controller');

let gameEngineController;

describe('test for game engine controller', () => {
    beforeEach(() => {
        gameEngineController = createGameEngineController(gameEngineService);        
    });

    describe('tests for distribute cards', () => {
        test('distribute 3 cards succesfully', async () => {
            const req = { body: { cardsPerPlayer: 3 }, params: { gameId: 'game-1' } };
            const res = createRes();
            const players = {
                id  : 'player-1',
                cards: [
                    {
                        id: '1',
                        color: 'RED',
                        value: '1',
                        type: 'NUMBER'
                    },
                    {
                        id: '1',
                        color: 'RED',
                        value: '2',
                        type: 'NUMBER'
                    },
                    {
                        id: '1',
                        color: 'RED',
                        value: '2',
                        type: 'NUMBER'
                    },
                ]
            };
            gameEngineService.distributeCards.mockResolvedValue({ ok: true, result: players });

            await gameEngineController.distributeCards(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'Cards distributed succesfully', players: players });
        });
    });

    describe('tests for play card', () => {
        test('play a card succesfully', async () => {
            const req = { body: { cardId: '3' }, params: { gameId: 'game-1' }, player: { id: 'player-1' } };
            const res = createRes();
            const nextPlayer = { playerId: 'player-1', position: 0, Player: { name: 'Ana' } };
            const result = { ok: true, result: { message: 'Card played', nextPlayer } };
            gameEngineService.playCard.mockResolvedValue(result);

            await gameEngineController.playCard(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(result.result);
        });
    });

    describe('tests for draw card', () => {
        test('draw a card succesfully', async () => {
            const req = { params: { gameId: 'game-1' }, player: { id: 'player-1' } };
            const res = createRes();
            const nextPlayer = { playerId: 'player-2', position: 0, Player: { name: 'Ana' } };
            const result = { ok: true, result: { message: 'Card drawn', cardDrawn: {color: 'RED', value: null, type: '+2'}, nextPlayer } };
            gameEngineService.drawCard.mockResolvedValue(result);

            await gameEngineController.drawCard(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(result.result);
        });
    });
    describe('tests for say uno', () => {
        test('say uno succesfully', async () => {
            const req = { params: { gameId: 'game-1' }, player: { id: 'player-1' } };
            const res = createRes();
            const player = { playerId: 'player-1', position: 1, Player: { name: 'Ana' } };
            const result = { ok: true, result: { action: 'said uno', player } };
            gameEngineService.sayUno.mockResolvedValue(result);

            await gameEngineController.sayUno(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(result.result);
        });
    });

    describe('tests for challenge player', () => {
        test('challenge a player succesfully', async () => {
            const req = { params: { gameId: 'game-1' }, player: { id: 'player-1' }, body: { challengedPlayerId: 'player-2'} };
            const res = createRes();
            const challengerPlayer = { playerId: 'player-1', position: 1, Player: { name: 'Ana' } };
            const challengedPlayer = { playerId: 'player-2', position: 2, Player: { name: 'Luis' } };
            const result = { ok: true, result: { action: 'player Luis challenged', challenger: challengerPlayer, challenged: challengedPlayer } };
            gameEngineService.challengePlayer.mockResolvedValue(result);

            await gameEngineController.challengePlayer(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(result.result);
        });
    });
});