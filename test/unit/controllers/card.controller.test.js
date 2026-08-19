const { cardService } = require('../utils/services-mocks.utils');
const { createRes } = require('../utils/express-mocks.utils');
const createCardController = require('../../../src/controllers/card.controller');

let cardController;

describe('test for card controller', () => {
    beforeEach(() => {
        cardController = createCardController(cardService);
    });

    describe('Tests for createCards', () => {
        test('initialize cards and responds 201', async () => {
            const req = {};
            const res = createRes();
            cardService.initializeCards.mockResolvedValue();

            await cardController.createCards(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'cards created succesfully' });
        });
    });

    describe('Tests for getAllCards', () => {
        test('get all cards and responds 200', async () => {
            const req = {};
            const res = createRes();
            cardService.getAllCards.mockResolvedValue([{ id: 'card-1' }]);

            await cardController.getAllCards(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ id: 'card-1' }]);
        });
    });

    describe('Tests for getCardById', () => {
        test('get a card by id and responds 200', async () => {
            const req = { params: { id: 'card-1' } };
            const res = createRes();
            cardService.findCardById.mockResolvedValue({ id: 'card-1', color: 'RED' });

            await cardController.getCardById(req, res);

            expect(cardService.findCardById).toHaveBeenCalledWith('card-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'card-1', color: 'RED' });
        });
    });
});
