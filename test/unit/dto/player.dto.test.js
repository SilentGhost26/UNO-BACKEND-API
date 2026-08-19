const {
    toResponseDto,
    fromCreateDto,
    fromUpdateDto
} = require('../../../src/dto/player.dto');

describe('toResponseDto', () => {
    test('should get a responseDto', () => {
        const player = {
            id: 'player-1',
            name: 'Alice',
            age: 25,
            email: 'alice@example.com',
            createdAt: '2026-07-28T00:00:00.000Z'
        };
        
        const dto = {
            id: 'player-1',
            name: 'Alice',
            age: 25,
            email: 'alice@example.com',
            createdAt: '2026-07-28T00:00:00.000Z'
        };
        
        expect(toResponseDto(player)).toStrictEqual(dto);
    });

    test('should not mutate the original object', () => {
        const player = {
            id: 'player-1',
            name: 'Alice',
            age: 25,
            email: 'alice@example.com',
            createdAt: '2026-07-28T00:00:00.000Z'
        };

        const copy = { ...player };

        toResponseDto(player);
        expect(player).toEqual(copy);
    });
});

describe('fromCreateDto', () => {
    test('should get a create player object', () => {
        const dto = {
            name: 'Alice',
            age: 25,
            email: 'alice@example.com',
            password: 'secret'
        };
        
        const player = {
            name: 'Alice',
            age: 25,
            email: 'alice@example.com',
            password: 'secret'
        };
        
        expect(fromCreateDto(dto)).toStrictEqual(player);
    });

    test('should not mutate the original object', () => {
        const dto = {
            name: 'Alice',
            age: 25,
            email: 'alice@example.com',
            password: 'secret'
        };

        const copy = { ...dto };

        fromCreateDto(dto);
        expect(dto).toEqual(copy);
    });
});

describe('fromUpdateDto', () => {
    test('should get an update player object', () => {
        const dto = {
            name: 'Alice',
            age: 26,
            email: 'alice@example.com'
        };
        
        const player = {
            name: 'Alice',
            age: 26,
            email: 'alice@example.com'
        };
        
        expect(fromUpdateDto(dto)).toStrictEqual(player);
    });

    test('should not mutate the original object', () => {
        const dto = {
            name: 'Alice',
            age: 26,
            email: 'alice@example.com'
        };

        const copy = { ...dto };

        fromUpdateDto(dto);
        expect(dto).toEqual(copy);
    });
});
