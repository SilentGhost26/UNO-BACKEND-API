const { toGameCardResponseDto } = require('../../../src/dto/game-card.dto');

describe('toGameCardResponseDto', () => {
    test('should get a responseDto', () => {
        const gameCard = {
            gameId: 'game-1',
            cardId: 'card-1',
            zone: 'DECK',
            position: 1,
            playerId: 'player-1'
        };
        
        const dto = {
            gameId: 'game-1',
            cardId: 'card-1',
            zone: 'DECK',
            position: 1,
            playerId: 'player-1'
        };
        
        expect(toGameCardResponseDto(gameCard)).toStrictEqual(dto);
    });

    test('should not mutate the original object', () => {
        const gameCard = {
            gameId: 'game-1',
            cardId: 'card-1',
            zone: 'DECK',
            position: 1,
            playerId: 'player-1'
        };

        const copy = { ...gameCard };

        toGameCardResponseDto(gameCard);
        expect(gameCard).toEqual(copy);
    });
});
