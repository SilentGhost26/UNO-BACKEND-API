const cardRepository = require('../repositories/card.repository');
const cardDto = require('../dto/card.dto');
const notFoundHelper = require('../helpers/not-found.helper');

const CARDS_AMOUNT = 108;
const CARD_COLORS = ['GREEN', 'BLUE', 'YELLOW', 'RED'];
const CARD_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const CARD_TYPES = ['BLOCK', 'REVERSE', '+2'];
const SPECIAL_TYPES = ['+4', 'WILD']

/**
 * Initialize the main cards of the original game (108 cards in total)
 * If there is any change in the records of cards, the cards will be initialized again
 */
const initializeCards = async () => {
    const cards = await cardRepository.findAll();
    if (cards.length == CARDS_AMOUNT) {
        const error = new Error('Cards already initialized');
        error.statusCode = 409;
        throw error;
    }
    await cardRepository.removeAll();
    const newCards = [];

    CARD_COLORS.forEach(c => {
        CARD_VALUES.forEach(v => {
            newCards.push({color: c, value: v, type: 'NUMBER'});
            newCards.push({color: c, value: v, type: 'NUMBER'});
        });
        newCards.push({color: c, value: '0', type: 'NUMBER'});
        CARD_TYPES.forEach(t => {
            newCards.push({color: c, value: null, type: t});
            newCards.push({color: c, value: null, type: t});
        });
    });

    SPECIAL_TYPES.forEach(t => {
        newCards.push({color: 'MULTICOLOR', value: null, type: t});
        newCards.push({color: 'MULTICOLOR', value: null, type: t});
        newCards.push({color: 'MULTICOLOR', value: null, type: t});
        newCards.push({color: 'MULTICOLOR', value: null, type: t});
    });

    await cardDto.toResponseDto(cardRepository.bulkCreate(newCards));
}

/**
 * Get all cards
 * @returns A list of the cards
 */
const getAllCards = async () => {
    const cards = await cardRepository.findAll();
    return cards.map(c => cardDto.toResponseDto(c));
}

/**
 * Find a card by its Id
 * @param id : id of the card
 * @returns The found card
 */
const findCardById = async (id) => {
    const card = await cardRepository.getById(id);
    if(!card) {
        notFoundHelper.throwError404(id, 'card');
    }
    return cardDto.toResponseDto(card);
}

/**
 * Create a card
 * @param cardData : the data of the card that will be created 
 * @returns The created card
 */
const createCard = async (cardData) => {
    const card = cardDto.fromCreate(cardData);
    const newCard = await cardRepository.create(card);

    if(!newCard) {
        notFoundHelper.throwError404(id, 'card');
    }

    return cardDto.toResponseDto(newCard);
}

/**
 * Update a card by its id
 * @param id : if of the card 
 * @param cardData : the data of the card that will be updated
 * @returns : The updated card
 */
const updateCard = async (id, cardData) => { 
    const card = cardDto.fromUpdate(cardData);
    const updatedCard = await cardRepository.update(card);
    if (!updatedCard) {
            notFoundHelper.throwError404(id, 'card');
        }
    
    return cardDto.toResponseDto(updatedCard);
}

/**
 * Delete a card by its id
 * @param id : id of the card 
 */
const deleteCard = async (id) => {
    const deleted = await cardRepository.remove(id);
    if(!deleted) {
        notFoundHelper.throwError404(id, 'card');
    }
}

module.exports = {
    initializeCards,
    getAllCards,
    findCardById,
    createCard,
    updateCard,
    deleteCard
}

