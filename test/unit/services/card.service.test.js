const createCardService = require('../../../src/services/card.service');
const { ok } = require('../../../src/helpers/result.helper');
const { cardRepository } = require('../utils/repository-mocks.utils');
const cardDto = require('../../../src/dto/card.dto');
const notFoundHelper = require('../../../src/helpers/not-found.helper');
const conflictHelper = require('../../../src/helpers/conflict.helper');

let cardService;

describe('test for card service', () => {
    beforeEach(() => {
        cardService = createCardService(
            cardRepository,
            cardDto,
            notFoundHelper,
            conflictHelper,
            { ok }
        );
    });

    describe('Tests for initializeCards', () => {
        test('initialize cards successfully', async () => {
            cardRepository.findAll.mockResolvedValue(Array(107).fill({}));
            cardRepository.removeAll.mockResolvedValue(true);
            cardRepository.bulkCreate.mockResolvedValue([{ id: 'card-1' }]);

            const result = await cardService.initializeCards();
            expect(result).toEqual({ ok: true, result: undefined });
            expect(cardRepository.removeAll).toHaveBeenCalled();
            expect(cardRepository.bulkCreate).toHaveBeenCalled();
        });

        test('return an error result when cards are already initialized', async () => {
            cardRepository.findAll.mockResolvedValue(Array(108).fill({}));

            const result = await cardService.initializeCards();

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'Cards already initialized',
                statusCode: 409,
            });
        });
    });

    describe('Tests for getAllCards', () => {
        test('get all cards', async () => {
            cardRepository.findAll.mockResolvedValue([
                { id: 'card-1', color: 'RED', value: '1', type: 'NUMBER' },
                { id: 'card-2', color: 'BLUE', value: '2', type: 'NUMBER' },
            ]);

            const result = await cardService.getAllCards();

            expect(result.result).toHaveLength(2);
            expect(result.result[0].color).toBe('RED');
        });
    });

    describe('Tests for findCardById', () => {
        test('get a card by its id', async () => {
            cardRepository.getById.mockResolvedValue({ id: 'card-1', color: 'RED', value: '1', type: 'NUMBER' });

            const result = await cardService.findCardById('card-1');

            expect(result.result.id).toBe('card-1');
        });

        test('return an error result when the card does not exist', async () => {
            cardRepository.getById.mockResolvedValue(null);

            const result = await cardService.findCardById('nonexistent-card');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'card with ID nonexistent-card not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for createCard', () => {
        test('create a card successfully', async () => {
            cardRepository.create.mockResolvedValue({ id: 'card-3', color: 'GREEN', value: '3', type: 'NUMBER' });

            const result = await cardService.createCard({ color: 'GREEN', value: '3', type: 'NUMBER' });

            expect(result.result.color).toBe('GREEN');
            expect(result.result.value).toBe('3');
        });
    });

    describe('Tests for updateCard', () => {
        test('update a card successfully', async () => {
            cardRepository.update.mockResolvedValue({ id: 'card-1', color: 'YELLOW', value: '4', type: 'NUMBER' });

            const result = await cardService.updateCard('card-1', { color: 'YELLOW', value: '4', type: 'NUMBER' });

            expect(result.result.color).toBe('YELLOW');
        });

        test('return an error result when the card does not exist', async () => {
            cardRepository.update.mockResolvedValue(null);

            const result = await cardService.updateCard('nonexistent-card', { color: 'RED', value: '1', type: 'NUMBER' });

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'card with ID nonexistent-card not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for deleteCard', () => {
        test('delete a card successfully', async () => {
            cardRepository.remove.mockResolvedValue(true);

            await expect(cardService.deleteCard('card-1')).resolves.toEqual({ ok: true, result: undefined });
        });

        test('return an error result when the card does not exist', async () => {
            cardRepository.remove.mockResolvedValue(false);

            const result = await cardService.deleteCard('nonexistent-card');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'card with ID nonexistent-card not found',
                statusCode: 404,
            });
        });
    });
});
