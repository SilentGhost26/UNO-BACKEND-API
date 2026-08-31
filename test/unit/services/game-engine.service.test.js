const createGameEngineService = require('../../../src/services/game-engine.service');
const { gameRepository, gameCardRepository, gamePlayerRepository, playerRepository, cardRepository, historyRepository } = require('../utils/repository-mocks.utils');

const cardDto = require('../../../src/dto/card.dto');
const gameCardDto = require('../../../src/dto/game-card.dto');
const gamePlayerDto = require('../../../src/dto/game-player.dto');
const notFoundHelper = require('../../../src/helpers/not-found.helper');
const conflictHelper = require('../../../src/helpers/conflict.helper');
const { ok, err, runValidators } = require('../../../src/helpers/result.helper');
const rulesPlayCardValidators = require('../../../src/services/validators/rules-play-card.validator');
const hasValidCardValidators = require('../../../src/services/validators/has-valid-card.validator');


let gameEngineService;

describe('Tests for game engine service', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        gameEngineService = createGameEngineService(
            gameRepository,
            gameCardRepository,
            gamePlayerRepository,
            playerRepository,
            cardRepository,
            historyRepository,
            cardDto,
            gameCardDto,
            gamePlayerDto,
            notFoundHelper,
            conflictHelper,
            { ok, err, runValidators },
            rulesPlayCardValidators,
            hasValidCardValidators,
        );
    });

    describe('Tests for distribute cards', () => {
        const cards = [
            {
                cardId: 1,
                playerId: null,
                zone: 'DECK',
                position: 1,
                Card: {
                    id: 1,
                    value: '1',
                    color: 'RED',
                    type: 'NUMBER'
                }
            },
            {
                cardId: 2,
                playerId: null,
                zone: 'DECK',
                position: 2,
                Card: {
                    id: 2,
                    value: '5',
                    color: 'GREEN',
                    type: 'NUMBER'
                }
            },
            {
                cardId: 3,
                playerId: null,
                zone: 'DECK',
                position: 3,
                Card: {
                    id: 3,
                    value: 1,
                    color: 'BLUE',
                    type: 'NUMBER'
                }
            },
            {
                cardId: 4,
                playerId: null,
                zone: 'DECK',
                position: 4,
                Card: {
                    id: 4,
                    value: 1,
                    color: 'YELLOW',
                    type: 'NUMBER'
                }
            },
        ];

        test('Distribute 3 cards per player succesfully', async () => {
            const cardsInGame = [...cards, ...cards, ...cards].map((card) => {
                const instance = {
                    ...card,
                    gameId: 'game-1',
                    dataValues: { ...card, gameId: 'game-1' }
                };
                instance.dataValues = instance;
                return instance;
            });
            const players = [{ playerId: 'player-1' }, { playerId: 'player-2' }];
            const game = { id: 1, status: 'PLAYING', distributedCards: false };

            gameRepository.getById.mockResolvedValue(game);
            gamePlayerRepository.getByGameId.mockResolvedValue(players);
            gameCardRepository.getByGameId.mockResolvedValue(cardsInGame);
            gameRepository.update.mockResolvedValue({ ...game, distributedCards: true });
            gameCardRepository.update.mockImplementation(async (...args) => {
                const [gameId, cardIdOrData, maybeGameCardData] = args;
                if (args.length === 2) {
                    return {
                        id: gameId,
                        ...cardIdOrData,
                    };
                }
                return {
                    ...maybeGameCardData,
                    gameId,
                    cardId: cardIdOrData,
                    playerId: maybeGameCardData.playerId,
                    zone: maybeGameCardData.zone,
                    position: maybeGameCardData.position,
                    Card: maybeGameCardData.Card,
                };
            });
            gameCardRepository.getTopCardFromDeck.mockResolvedValue({
                cardId: 5,
                Card: { id: 5, value: '1', color: 'RED', type: 'NUMBER' },
            });

            const result = await gameEngineService.distributeCards('game-1', 3);

            expect(result.ok).toBe(true);
            expect(result.result).toHaveLength(2);
            expect(result.result[0].cards).toHaveLength(3);
            expect(result.result[1].cards).toHaveLength(3);
            expect(gameCardRepository.update).toHaveBeenCalledTimes(7);
            expect(gameRepository.update).toHaveBeenCalledWith('game-1', { distributedCards: true, currentColor: 'RED' });
        });

        test('returns error when the game is not found', async () => {
            gameRepository.getById.mockResolvedValue(null);

            const result = await gameEngineService.distributeCards('nonexistent-game', 3);

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID nonexistent-game not found',
                statusCode: 404,
            });
        });

        test('returns error when the game already has distributed the cards', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING', distributedCards: true });
            gamePlayerRepository.getByGameId.mockResolvedValue([{ playerId: 'player-1' }, { playerId: 'player-2' }]);

            const result = await gameEngineService.distributeCards('game-1', 3);

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 has already distributed the cards',
                statusCode: 409,
            });
        });

        test('returns error when the game is not playing', async () => {
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'WAITING', distributedCards: false });
            gamePlayerRepository.getByGameId.mockResolvedValue([{ playerId: 'player-1' }, { playerId: 'player-2' }]);

            const result = await gameEngineService.distributeCards('game-1', 3);

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 is not playing',
                statusCode: 409,
            });
        });
    });

    describe('Tests for play card', () => {
        const rules = { allowDrawFour: true, allowAccumulateDraw: true, allowReverse: true };
        const game = { id: 'game-1', direction: 'RIGHT', currentColor: 'RED', rules, mustDraw: false, accumulatedCardsToDraw: 0, status: 'PLAYING' };
        const players = [
            { playerId: 'player-1', position: 0, Player: { name: 'Ana' } },
            { playerId: 'player-2', position: 1, Player: { name: 'Luis' } },
            { playerId: 'player-3', position: 2, Player: { name: 'Andres' } },
        ];
        const currentPlayer = players[0];
        const lastCard = { position: 3, Card: { color: 'RED', value: '9', type: 'NUMBER' } };

        test('returns a conflict when it is not the turn of the player', async () => {
            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(players[1]);
            gameRepository.getByIdWithRules.mockResolvedValue(game);
            gameCardRepository.getByIds.mockResolvedValue(null);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);
            gameCardRepository.getPlayerHand.mockResolvedValue([]);

            const result = await gameEngineService.playCard('player-1', 'game-1', 10);

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'it is not the turn for the player with ID player-1',
                statusCode: 409,
            });
        });

        test('returns a conflict when the game is not playing', async () => {
            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(players[0]);
            gameRepository.getByIdWithRules.mockResolvedValue({ ...game, status: 'FINISHED' });
            gameCardRepository.getByIds.mockResolvedValue(null);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);
            gameCardRepository.getPlayerHand.mockResolvedValue([]);

            const result = await gameEngineService.playCard('player-1', 'game-1', 10);
            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 is not playing',
                statusCode: 409,
            });
        });

        test('plays a valid card successfully and passes the turn to the next player', async () => {
            const card = { playerId: 'player-1', cardId: 10, Card: { color: 'RED', value: '5', type: 'NUMBER' } };

            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(game);
            gameCardRepository.getByIds.mockResolvedValue(card);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);
            gameCardRepository.getPlayerHand.mockResolvedValue([]);
            gameRepository.getById.mockResolvedValue(game);
            gamePlayerRepository.getByGameId.mockResolvedValue(players);
            gameRepository.update.mockResolvedValue({});
            gameCardRepository.update.mockResolvedValue({});
            gameCardRepository.getCuantityCardsInHand.mockResolvedValue(2);
            const result = await gameEngineService.playCard('player-1', 'game-1', 10);

            expect(result.ok).toBe(true);
            expect(result.result.action).toBe('Card played');
            expect(result.result.nextPlayer).toMatchObject({ playerId: 'player-2', name: 'Luis' });
            expect(gameCardRepository.update).toHaveBeenCalledWith('game-1', 10, { zone: 'DISCARD', position: 4, playerId: null });
            expect(gameRepository.update).toHaveBeenCalledWith('game-1', { direction: 'RIGHT', currentPlayerIndex: 1, currentColor: 'RED', mustDraw: false, accumulatedCardsToDraw: 0 });
        });

        test('plays a block card successfully, skiping the next player turn', async () => {
            const card = { playerId: 'player-1', cardId: 10, Card: { color: 'RED', value: null, type: 'BLOCK' } };

            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(game);
            gameCardRepository.getByIds.mockResolvedValue(card);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);
            gameCardRepository.getPlayerHand.mockResolvedValue([]);
            gameRepository.getById.mockResolvedValue(game);
            gamePlayerRepository.getByGameId.mockResolvedValue(players);
            gameRepository.update.mockResolvedValue({});
            gameCardRepository.update.mockResolvedValue({});
            gameCardRepository.getCuantityCardsInHand.mockResolvedValue(2);
            const result = await gameEngineService.playCard('player-1', 'game-1', 10);

            expect(result.ok).toBe(true);
            expect(result.result.action).toBe('Card played');
            expect(result.result.nextPlayer).toMatchObject({ playerId: 'player-3', name: 'Andres' });
            expect(gameCardRepository.update).toHaveBeenCalledWith('game-1', 10, { zone: 'DISCARD', position: 4, playerId: null });
            expect(gameRepository.update).toHaveBeenCalledWith('game-1', { direction: 'RIGHT', currentPlayerIndex: 2, currentColor: 'RED', mustDraw: false, accumulatedCardsToDraw: 0 });
        });

        test('returns a conflict when the card does not match the top card of the discard pile', async () => {
            const card = { playerId: 'player-1', cardId: 11, Card: { color: 'GREEN', value: '2', type: 'NUMBER' } };

            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(game);
            gameCardRepository.getByIds.mockResolvedValue(card);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);
            gameCardRepository.getPlayerHand.mockResolvedValue([]);

            const result = await gameEngineService.playCard('player-1', 'game-1', 11);

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'card with ID 11 does not matches',
                statusCode: 409,
            });
        });

        test('returns a conflict when the card is not in the player hand', async () => {
            const card = { playerId: 'player-2', cardId: 12, Card: { color: 'RED', value: '3', type: 'NUMBER', mustDraw: false, accumulatedCardsToDraw: 0 } };

            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(game);
            gameCardRepository.getByIds.mockResolvedValue(card);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);

            const result = await gameEngineService.playCard('player-1', 'game-1', 12);

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'card with ID 12 is not in the hand',
                statusCode: 409,
            });
        });

        test('returns 404 when the cardId does not exist', async () => {
            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(game);
            gameCardRepository.getByIds.mockResolvedValue(null);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);

            const result = await gameEngineService.playCard('player-1', 'game-1', 999);

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'card with ID 999 not found',
                statusCode: 404,
            });
        });
    });

    describe('Tests for draw card', () => {
        const rules = { allowDrawFour: true, allowAccumulateDraw: true, allowReverse: true };
        const game = { id: 'game-1', direction: 'RIGHT', currentColor: 'RED', rules, status: 'PLAYING' };
        const players = [
            { playerId: 'player-1', position: 0, Player: { name: 'Ana' } },
            { playerId: 'player-2', position: 1, Player: { name: 'Luis' } },
        ];
        const currentPlayer = players[0];
        const lastCard = { position: 3, Card: { color: 'GREEN', value: '9', type: 'NUMBER' } };

        test('returns a conflict when it is not the turn of the player', async () => {
            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(players[1]);
            gameRepository.getByIdWithRules.mockResolvedValue(game);

            const result = await gameEngineService.drawCard('game-1', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'it is not the turn for the player with ID player-1',
                statusCode: 409,
            });
        });

        test('returns a conflict when the game is not playing', async () => {
            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(players[1]);
            gameRepository.getByIdWithRules.mockResolvedValue({ ...game, status: 'FINISHED'});

            const result = await gameEngineService.drawCard('game-1', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 is not playing',
                statusCode: 409,
            });
        });

        test('returns a conflict when the player already has a valid card in hand', async () => {
            const hand = [{ Card: { color: 'GREEN', value: '2', type: 'NUMBER' } }];

            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(game);
            gameCardRepository.getPlayerHand.mockResolvedValue(hand);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);
            gameCardRepository.getTopCardFromDeck.mockResolvedValue(lastCard);

            const result = await gameEngineService.drawCard('game-1', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'Player with ID player-1 has a valid card in his hand',
                statusCode: 409,
            });
        });

        test('draws a card, it is not playable, and passes the turn', async () => {
            const hand = [{ Card: { color: 'RED', value: '2', type: 'NUMBER' } }];
            const topOfDeck = { cardId: 50, Card: { color: 'BLUE', value: '4', type: 'NUMBER' } };
            const drawnCard = { cardId: 50, playerId: 'player-1', zone: 'HAND', Card: topOfDeck.Card };

            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(game);
            gameCardRepository.getPlayerHand.mockResolvedValue(hand);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);
            gameCardRepository.getTopCardFromDeck.mockResolvedValue(topOfDeck);
            gameCardRepository.update.mockResolvedValue(drawnCard);
            gameRepository.getById.mockResolvedValue(game);
            gamePlayerRepository.getByGameId.mockResolvedValue(players);
            gameRepository.update.mockResolvedValue({});

            const result = await gameEngineService.drawCard('game-1', 'player-1');
            expect(result.ok).toBe(true);
            expect(result.result.action).toBe('card drawn and pass turn');
            expect(result.result.drawnCards).toEqual([{ id: undefined, color: 'BLUE', value: '4', type: 'NUMBER' }]);
            expect(result.result.nextPlayer).toMatchObject({ playerId: 'player-2', name: 'Luis' });
            expect(gameCardRepository.update).toHaveBeenCalledWith('game-1', 50, { zone: 'HAND', position: null, playerId: 'player-1' });
        });

        test('draws a card that turns out playable and keeps the turn with the same player', async () => {
            const hand = [{ Card: { color: 'RED', value: '2', type: 'NUMBER' } }];
            const topOfDeck = { cardId: 60, Card: { id: 60, color: 'GREEN', value: '3', type: 'NUMBER' } };
            const drawnCard = { cardId: 60, playerId: 'player-1', zone: 'HAND', Card: topOfDeck.Card };

            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(game);
            gameCardRepository.getPlayerHand.mockResolvedValue(hand);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue(lastCard);
            gameCardRepository.getTopCardFromDeck.mockResolvedValue(topOfDeck);
            gameCardRepository.update.mockResolvedValue(drawnCard);

            const result = await gameEngineService.drawCard('game-1', 'player-1');
            expect(result.ok).toBe(true);
            expect(result.result.action).toBe('card drawn');
            expect(result.result.drawnCards).toEqual([{ id: 60, color: 'GREEN', value: '3', type: 'NUMBER' }]);
            expect(result.result.nextPlayer).toMatchObject({ playerId: 'player-1', name: 'Ana' });
        });

        test('draws two card by a +2 and passes the turn', async () => {
            const hand = [{ Card: { color: 'GREEN', value: '2', type: 'NUMBER' } }];
            const topOfDeck = { cardId: 50, Card: {id: 50, color: 'BLUE', value: '4', type: 'NUMBER' } };
            const drawnCard = { cardId: 50, playerId: 'player-1', zone: 'HAND', Card: topOfDeck.Card };
            const gameWithDraw = { ...game, mustDraw: true, accumulatedCardsToDraw: 2 };

            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(gameWithDraw);
            gameCardRepository.getPlayerHand.mockResolvedValue(hand);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue({ position: 3, Card: { color: 'BLUE', value: null, type: '+2' } });
            gameCardRepository.getTopCardFromDeck.mockResolvedValue(topOfDeck);
            gameCardRepository.update.mockResolvedValue(drawnCard);
            gameRepository.getById.mockResolvedValue(gameWithDraw);
            gamePlayerRepository.getByGameId.mockResolvedValue(players);
            gameRepository.update.mockResolvedValue({});

            const result = await gameEngineService.drawCard('game-1', 'player-1');

            expect(result.ok).toBe(true);
            expect(result.result.action).toBe('card drawn and pass turn');
            expect(result.result.drawnCards).toEqual([{ id: 50, color: 'BLUE', value: '4', type: 'NUMBER' }, { id: 50, color: 'BLUE', value: '4', type: 'NUMBER' }]);
            expect(result.result.nextPlayer).toMatchObject({ playerId: 'player-2', name: 'Luis' });
            expect(gameCardRepository.update).toHaveBeenCalledTimes(2);
        });

        test('draws four card by a +4 and passes the turn', async () => {
            const hand = [{ Card: { color: 'GREEN', value: '2', type: 'NUMBER' } }];
            const topOfDeck = { cardId: 50, Card: {id: 50, color: 'BLUE', value: '4', type: 'NUMBER' } };
            const drawnCard = { cardId: 50, playerId: 'player-1', zone: 'HAND', Card: topOfDeck.Card };
            const gameWithDraw = { ...game, mustDraw: true, accumulatedCardsToDraw: 4 };

            gamePlayerRepository.getCurrentPlayerToPlay.mockResolvedValue(currentPlayer);
            gameRepository.getByIdWithRules.mockResolvedValue(gameWithDraw);
            gameCardRepository.getPlayerHand.mockResolvedValue(hand);
            gameCardRepository.getTopCardFromDiscard.mockResolvedValue({ position: 3, Card: { color: 'BLUE', value: null, type: '+4' } });
            gameCardRepository.getTopCardFromDeck.mockResolvedValue(topOfDeck);
            gameCardRepository.update.mockResolvedValue(drawnCard);
            gameRepository.getById.mockResolvedValue(gameWithDraw);
            gamePlayerRepository.getByGameId.mockResolvedValue(players);
            gameRepository.update.mockResolvedValue({});

            const result = await gameEngineService.drawCard('game-1', 'player-1');

            expect(result.ok).toBe(true);
            expect(result.result.action).toBe('card drawn and pass turn');
            expect(result.result.drawnCards[0]).toEqual({ id: 50, color: 'BLUE', value: '4', type: 'NUMBER' });
            expect(result.result.drawnCards.length).toBe(4);
            expect(result.result.nextPlayer).toMatchObject({ playerId: 'player-2', name: 'Luis' });
            expect(gameCardRepository.update).toHaveBeenCalledTimes(4);
        });
    });

    describe('Tests for say uno', () => {
        test('returns conflict error when the player already said uno', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue({ playerId: 'player-1', gameId: 'game-1', saidUno: true });
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING'});
            const result = await gameEngineService.sayUno('game-1', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID player-1 already said uno',
                statusCode: 409,
            });
            expect(gamePlayerRepository.update).toHaveBeenCalledTimes(0);
        });

        test('returns conflict error when the game is not playing', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue({ playerId: 'player-1', gameId: 'game-1', saidUno: false });
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'FINISHED'});
            const result = await gameEngineService.sayUno('game-1', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 is not playing',
                statusCode: 409,
            });
            expect(gamePlayerRepository.update).toHaveBeenCalledTimes(0);
        });

        test('returns conflict error when the player still has more than 1 cards', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue({ playerId: 'player-1', gameId: 'game-1', saidUno: false });
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING'});
            gameCardRepository.getCuantityCardsInHand.mockResolvedValue(2);
            const result = await gameEngineService.sayUno('game-1', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID player-1 still has more cards',
                statusCode: 409,
            });
            expect(gamePlayerRepository.update).toHaveBeenCalledTimes(0);
        });

        test('say uno succesfully', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue({ id: '1', playerId: 'player-1', gameId: 'game-1', saidUno: false, Player: { name: 'player' } });
            gameCardRepository.getCuantityCardsInHand.mockResolvedValue(1);
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING'});
            gamePlayerRepository.update.mockResolvedValue({ id: '1', playerId: 'player-1', gameId: 'game-1', saidUno: true, Player: { name: 'player' } });
            const result = await gameEngineService.sayUno('game-1', 'player-1');

            expect(result.ok).toBe(true);
            expect(result.result.action).toBe('Said uno');
            expect(result.result.player).toMatchObject({ id: '1', playerId: 'player-1', name: 'player' });
        });
    });

    describe('Tests for reload deck', () => {
        test('returns error when there are still cards in the deck', async () => {
            gameCardRepository.getTopCardFromDeck.mockResolvedValue({ cardId: 'card-1' });

            const result = await gameEngineService.reloadDeck('game-1');
            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'there are still cards in the deck'
            });
        });

        test('reload the deck succesfully', async () => {
            gameCardRepository.getByGameId.mockResolvedValue([
                { cardId: 'card-1', gameId: 'game-1', playerId: null, position: 1, zone: 'DISCARD' },
                { cardId: 'card-2', gameId: 'game-1', playerId: null, position: 1, zone: 'DISCARD' },
                { cardId: 'card-3', gameId: 'game-1', playerId: 'player-1', position: null, zone: 'HAND' },
            ]);
            
            const result = await gameEngineService.reloadDeck('game-1');
            
            expect(result.ok).toBe(true);
            expect(gameCardRepository.update).toHaveBeenCalledTimes(1);
        });
    });

    describe('Tests for challenge player', () => {
        const challengerPlayer = { id: '1', playerId: 'player-1', position: 0, Player: { name: 'Ana' } };
        const challengedPlayer = { id: '2', playerId: 'player-2', position: 1, Player: { name: 'Luis' } };

        beforeEach(() => {
            gameCardRepository.getTopCardFromDeck.mockResolvedValue({ cardId: 50, Card: { id: 50, color: 'BLUE', value: '4', type: 'NUMBER' } });
            gameCardRepository.getByGameId.mockResolvedValue([
                { cardId: 'card-1', gameId: 'game-1', playerId: null, position: 1, zone: 'DISCARD' },
            ]);
        });

        test('challenge a player succesfully', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce(challengedPlayer);
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce(challengerPlayer);
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING'});
            gameCardRepository.getCuantityCardsInHand.mockResolvedValue(1);
            gameCardRepository.update.mockResolvedValue({ cardId: 50, playerId: 'player-2', zone: 'HAND', Card: { id: 50, color: 'BLUE', value: '4', type: 'NUMBER' } });

            const result = await gameEngineService.challengePlayer('game-1', 'player-2', 'player-1');

            expect(result.ok).toBe(true);
            expect(result.result.action).toBe('player Luis challenged');
            expect(result.result.challenger).toMatchObject({ playerId: 'player-1', name: 'Ana' });
            expect(result.result.challengedPlayer).toMatchObject({ playerId: 'player-2', name: 'Luis' });
            expect(gameCardRepository.update).toHaveBeenCalledTimes(2);
        });

        test('returns conflict when player tries to challenge himself', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(challengerPlayer);
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING'});
            const result = await gameEngineService.challengePlayer('game-1', 'player-1', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player cannot challenge himself',
                statusCode: 409,
            });
        });

        test('returns conflict when the game is not playing', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValue(challengerPlayer);
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'FINISHED'});
            const result = await gameEngineService.challengePlayer('game-1', 'player-1', 'player-2');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'game with ID game-1 is not playing',
                statusCode: 409,
            });
        });

        test('returns 404 when the challenged player does not exist', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce(null);
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce(challengerPlayer);
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING'});
            const result = await gameEngineService.challengePlayer('game-1', 'player-2', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                statusCode: 404,
            });
        });

        test('returns 404 when the challenging player does not exist', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce(challengedPlayer);
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce(null);
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING'});
            const result = await gameEngineService.challengePlayer('game-1', 'player-2', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                statusCode: 404,
            });
        });

        test('returns conflict when the challenged player already said uno', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce({ ...challengedPlayer, saidUno: true });
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce(challengerPlayer);
            gameCardRepository.update.mockResolvedValue({ cardId: 50, playerId: 'player-2', zone: 'HAND', Card: { id: 50, color: 'BLUE', value: '4', type: 'NUMBER' } });
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING'});
            const result = await gameEngineService.challengePlayer('game-1', 'player-2', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID player-2 already said uno',
                statusCode: 409,
            });
        });

        test('returns conflict when the challenged player has more than 1 card', async () => {
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce(challengedPlayer);
            gamePlayerRepository.getByGameIdPlayerId.mockResolvedValueOnce(challengerPlayer);
            gameCardRepository.getCuantityCardsInHand.mockResolvedValue(2);
            gameCardRepository.update.mockResolvedValue({ cardId: 50, playerId: 'player-2', zone: 'HAND', Card: { id: 50, color: 'BLUE', value: '4', type: 'NUMBER' } });
            gameRepository.getById.mockResolvedValue({ id: 'game-1', status: 'PLAYING'});
            const result = await gameEngineService.challengePlayer('game-1', 'player-2', 'player-1');

            expect(result.ok).toBe(false);
            expect(result.error).toMatchObject({
                message: 'player with ID player-2 still has more cards',
                statusCode: 409,
            });
        });
    });
});