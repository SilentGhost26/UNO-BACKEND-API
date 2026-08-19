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
            gameCardService.createDeck.mockResolvedValue();

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
            gameCardService.getByGameId.mockResolvedValue([{ id: 'gc-1' }]);

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
            gameCardService.updateGameCard.mockResolvedValue({ id: 'gc-1' });

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
            gameCardService.getTopCardFromDeck.mockResolvedValue({ id: 'card-1' });

            await gameCardController.getTopCardFromDeck(req, res);

            expect(gameCardService.getTopCardFromDeck).toHaveBeenCalledWith('game-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ gameId: 'game-1', topCard: { id: 'card-1' } });
        });
    });
});
