const { gameCardService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const createGameCardController = require('../../../src/controllers/game-card.controller');

let gameCardController;

describe('test for game card controller', () => {
    beforeEach(() => {
        gameCardController = createGameCardController(gameCardService);
    });

    describe('Tests for createDeck', () => {
        test('create a deck and responds 201', async () => {
            const req = { params: { gameId: 'game-1' } };
            const res = createRes();
            gameCardService.createDeck.mockResolvedValue({ ok: true });

            await gameCardController.createDeck(req, res);

            expect(gameCardService.createDeck).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'Deck created succesfully' });
        });
    });

    describe('Tests for getCards', () => {
        test('get cards for a game and responds 200', async () => {
            const req = { params: { gameId: 'game-1' } };
            const res = createRes();
            gameCardService.getByGameId.mockResolvedValue({ ok: true, result: [{ id: 'gc-1' }] });

            await gameCardController.getCards(req, res);

            expect(gameCardService.getByGameId).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ id: 'gc-1' }]);
        });
    });

    describe('Tests for updateCard', () => {
        test('update a card in a game and responds 200', async () => {
            const req = { params: { gameId: 'game-1', cardId: 'card-1' }, body: { zone: 'HAND' } };
            const res = createRes();
            gameCardService.updateGameCard.mockResolvedValue({ ok: true, result: { id: 'gc-1' } });

            await gameCardController.updateCard(req, res);

            expect(gameCardService.updateGameCard).toHaveBeenCalledWith('game-1', 'card-1', { zone: 'HAND' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'gc-1' });
        });
    });

    describe('Tests for getTopCardFromDeck', () => {
        test('get the top card from the deck and responds 200', async () => {
            const req = { params: { gameId: 'game-1' } };
            const res = createRes();
            gameCardService.getTopCardFromDiscard.mockResolvedValue({ ok: true, result: { id: 'card-1' } });

            await gameCardController.getTopCardFromDiscard(req, res);

            expect(gameCardService.getTopCardFromDiscard).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ gameId: 'game-1', topCard: { id: 'card-1' } });
        });
    });

    describe('Tests for getPlayerHand', () => {
        test('get the top the player hand and responds 200', async () => {
            const req = { params: { gameId: 'game-1' }, player: { id: 'player-1' } };
            const res = createRes();
            gameCardService.getPlayerHand.mockResolvedValue({ ok: true, result: [{ id: '1', color: 'RED', value: '0', type: 'NUMBER' }] });

            await gameCardController.getPlayerHand(req, res);

            expect(gameCardService.getPlayerHand).toHaveBeenCalledWith('game-1', 'player-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ playerId: 'player-1', hand: [{ id: '1', color: 'RED', value: '0', type: 'NUMBER' }] });
        });
    });
});
