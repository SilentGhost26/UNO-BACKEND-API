const {
    toResponseDto,
    fromCreateDto,
    fromUpdateDto
} = require('../../../src/dto/game.dto');

describe('toResponseDto', () => {
    test('should get a responseDto', () => {
        const game = {
            id: 'game-1',
            title: 'UNO',
            maxPlayers: 4,
            status: 'WAITING',
            ownerId: 'owner-1',
            winnerId: 'player-1',
            createdAt: '2026-07-28T00:00:00.000Z'
        };
        
        const dto = {
            id: 'game-1',
            title: 'UNO',
            maxPlayers: 4,
            status: 'WAITING',
            ownerId: 'owner-1',
            winnerId: 'player-1',
            createdAt: '2026-07-28T00:00:00.000Z'
        };
        
        expect(toResponseDto(game)).toStrictEqual(dto);
    });

    test('should not mutate the original object', () => {
        const game = {
            id: 'game-1',
            title: 'UNO',
            maxPlayers: 4,
            status: 'WAITING',
            ownerId: 'owner-1',
            winnerId: 'player-1',
            createdAt: '2026-07-28T00:00:00.000Z'
        };

        const copy = { ...game };

        toResponseDto(game);
        expect(game).toEqual(copy);
    });
});

describe('fromCreateDto', () => {
    test('should get a create game object', () => {
        const dto = {
            title: 'UNO Match',
            maxPlayers: 4,
            status: 'WAITING',
            ownerId: 'owner-1'
        };
        
        const game = {
            title: 'UNO Match',
            maxPlayers: 4,
            status: 'WAITING',
            ownerId: 'owner-1'
        };
        
        expect(fromCreateDto(dto)).toStrictEqual(game);
    });

    test('should not mutate the original object', () => {
        const dto = {
            title: 'UNO',
            maxPlayers: 4,
            status: 'WAITING',
            ownerId: 'owner-1'
        };

        const copy = { ...dto };

        fromCreateDto(dto);
        expect(dto).toEqual(copy);
    });
});

describe('fromUpdateDto', () => {
    test('should get an update game object', () => {
        const dto = {
            title: 'UNO',
            maxPlayers: 4,
            status: 'PLAYING'
        };
        
        const game = {
            title: 'UNO',
            maxPlayers: 4,
            status: 'PLAYING'
        };
        
        expect(fromUpdateDto(dto)).toStrictEqual(game);
    });

    test('should not mutate the original object', () => {
        const dto = {
            title: 'UNO',
            maxPlayers: 4,
            status: 'PLAYING'
        };

        const copy = { ...dto };

        fromUpdateDto(dto);
        expect(dto).toEqual(copy);
    });
});
