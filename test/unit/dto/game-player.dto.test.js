const {
    fromCreate,
    toResponseDto,
    toScoreResponseDto,
    toGamePlayerInfoDto
} = require('../../../src/dto/game-player.dto');

describe('fromCreate', () => {
    test('should get a create game player object', () => {
        const dto = {
            gameId: 'game-1',
            playerId: 'player-1'
        };
        
        const gamePlayer = {
            gameId: 'game-1',
            playerId: 'player-1'
        };
        
        expect(fromCreate(dto)).toStrictEqual(gamePlayer);
    });

    test('should not mutate the original object', () => {
        const dto = {
            gameId: 'game-1',
            playerId: 'player-1'
        };

        const copy = { ...dto };

        fromCreate(dto);
        expect(dto).toEqual(copy);
    });
});

describe('toResponseDto', () => {
    test('should get a responseDto', () => {
        const data = {
            id: '1',
            gameId: 'game-1',
            playerId: 'player-1',
            score: 10
        };
        
        const dto = {
            id: '1',
            gameId: 'game-1',
            playerId: 'player-1',
            score: 10
        };
        
        expect(toResponseDto(data)).toStrictEqual(dto);
    });

    test('should not mutate the original object', () => {
        const data = {
            id: '1',
            gameId: 'game-1',
            playerId: 'player-1',
            score: 10
        };

        const copy = { ...data };

        toResponseDto(data);
        expect(data).toEqual(copy);
    });
});

describe('toScoreResponseDto', () => {
    test('should get a score responseDto', () => {
        const data = {
            id: '1',
            score: 15,
            Player: {
                name: 'Alice'
            }
        };
        
        const dto = {
            id: '1',
            name: 'Alice',
            score: 15
        };
        
        expect(toScoreResponseDto(data)).toStrictEqual(dto);
    });

    test('should not mutate the original object', () => {
        const data = {
            id: '1',
            score: 15,
            Player: {
                name: 'Alice'
            }
        };

        const copy = { ...data, Player: { ...data.Player } };

        toScoreResponseDto(data);
        expect(data).toEqual(copy);
    });
});

describe('toGamePlayerInfoDto', () => {
    test('should get a game player info dto', () => {
        const data = {
            id: '1',
            playerId: 'player-1',
            Player: {
                name: 'Alice'
            }
        };
        
        const dto = {
            id: '1',
            playerId: 'player-1',
            name: 'Alice'
        };
        
        expect(toGamePlayerInfoDto(data)).toStrictEqual(dto);
    });

    test('should not mutate the original object', () => {
        const data = {
            id: '1',
            playerId: 'player-1',
            Player: {
                name: 'Alice'
            }
        };

        const copy = { ...data, Player: { ...data.Player } };

        toGamePlayerInfoDto(data);
        expect(data).toEqual(copy);
    });
});
