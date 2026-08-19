const { toResponseDto, fromCreate, fromUpdate } = require('../../../src/dto/card.dto');

describe('toResponseDto', () => {
    test('should get a responseDto', () => {
        const card = {
            id: '123',
            color: 'YELLOW',
            value: '8',
            type: 'NUMBER'
        };
        
        const dto = {
            id: '123',
            color: 'YELLOW',
            value: '8',
            type: 'NUMBER'
        };
        
        expect(toResponseDto(card)).toStrictEqual(dto);
    });

    test('should not mutate the original object', () => {
        const card = {
            id: '123',
            color: 'YELLOW',
            value: '8',
            type: 'NUMBER'
        };

        const copy = {...card};

        toResponseDto(card);
        expect(card).toEqual(copy);
    });
});
    
describe('fromCreate', () => {
    test('should get a create card object', () => {
        const dto = {
            id: '123',
            color: 'YELLOW',
            value: '8',
            type: 'NUMBER'
        }
        
        const card = {
            color: 'YELLOW',
            value: '8',
            type: 'NUMBER'
        }
        
        expect(fromCreate(dto)).toStrictEqual(card);
    });

    test('should not mutate the original object', () => {
        const dto = {
            color: 'YELLOW',
            value: '8',
            type: 'NUMBER'
        };

        const copy = {...dto};

        fromCreate(dto);
        expect(dto).toEqual(copy);
    });
});
   
describe('fromUpdate', () => {
    test('should get a update card object', () => {
        const dto = {
            id: '123',
            color: 'YELLOW',
            value: '8',
            type: 'NUMBER'
        }
        
        const card = {
            color: 'YELLOW',
            value: '8',
            type: 'NUMBER'
        }
        
        expect(fromUpdate(dto)).toStrictEqual(card);
    });

    test('should not mutate the original object', () => {
        const dto = {
            color: 'YELLOW',
            value: '8',
            type: 'NUMBER'
        };

        const copy = {...dto};

        fromCreate(dto);
        expect(dto).toEqual(copy);
    });
});