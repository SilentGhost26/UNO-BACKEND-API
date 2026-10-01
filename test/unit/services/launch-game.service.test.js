const createLaunchGameService = require('../../../src/services/launch-game.service');
const startValidators = require('../../../src/services/validators/game-start.validator');
const deckValidators = require('../../../src/services/validators/rules-create-deck.validator');
const resultHelper = require('../../../src/helpers/result.helper');

const makeRepository = () => {
    const game = { id: 'game-1', ownerId: 1, status: 'WAITING' };
    const repository = {
        inTransaction: jest.fn(work => work({ LOCK: { UPDATE: 'UPDATE' } })),
        getGameForUpdate: jest.fn(async () => game),
        getPlayers: jest.fn(async () => [{ playerId: 1, position: 1 }, { playerId: 2, position: 2 }]),
        getPlayer: jest.fn(async () => ({ id: 1 })),
        getRules: jest.fn(async () => ({ allowDrawFour: true, allowReverse: true })),
        countGameCards: jest.fn(async () => 0),
        getCards: jest.fn(async () => Array.from({ length: 20 }, (_, index) => ({ id: index + 1, type: 'NUMBER', color: 'RED' }))),
        createGameCards: jest.fn(async () => {}),
        updateGame: jest.fn(async () => {}),
    };
    return { game, repository };
};

describe('launchGame', () => {
    test('creates and deals the deck inside one transaction', async () => {
        const { repository } = makeRepository();
        const service = createLaunchGameService(repository, startValidators, deckValidators, resultHelper);

        const result = await service.launchGame('game-1', 1, 7);

        expect(result).toEqual({ ok: true, result: { gameId: 'game-1', cardsPerPlayer: 7, players: 2 } });
        expect(repository.inTransaction).toHaveBeenCalledTimes(1);
        const cards = repository.createGameCards.mock.calls[0][0];
        expect(cards.filter(card => card.zone === 'HAND')).toHaveLength(14);
        expect(cards.filter(card => card.zone === 'DISCARD')).toHaveLength(1);
        expect(repository.updateGame).toHaveBeenCalledWith(expect.any(Object), {
            status: 'PLAYING', distributedCards: true, currentColor: 'RED',
        }, expect.any(Object));
    });

    test('does not change the game when deck creation fails', async () => {
        const { repository } = makeRepository();
        repository.createGameCards.mockRejectedValue(new Error('insert failed'));
        const service = createLaunchGameService(repository, startValidators, deckValidators, resultHelper);

        const result = await service.launchGame('game-1', 1, 7);

        expect(result.ok).toBe(false);
        expect(result.error.message).toBe('insert failed');
        expect(repository.updateGame).not.toHaveBeenCalled();
    });

    test('rejects a second launch before modifying cards', async () => {
        const { game, repository } = makeRepository();
        game.status = 'PLAYING';
        const service = createLaunchGameService(repository, startValidators, deckValidators, resultHelper);

        const result = await service.launchGame('game-1', 1, 7);

        expect(result.ok).toBe(false);
        expect(repository.createGameCards).not.toHaveBeenCalled();
        expect(repository.updateGame).not.toHaveBeenCalled();
    });
});
