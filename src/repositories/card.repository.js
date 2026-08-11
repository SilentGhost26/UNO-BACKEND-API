const Card = require('../models/card.model');

/**
 * Create a card in the database
 * @param cardData : card that will be created
 * @returns the created card
 */
const create = async (cardData) => {
    return await Card.create(cardData);
}

/**
 * Get a specific card from the database
 * @param  id : id of the card 
 * @returns the card that was found
 */
const getById = async (id) => {
    const card = await Card.findByPk(id);
    if(!card || card.isDeleted) {
        return null;
    }

    return card;
}

/**
 * Update a specific card in the database
 * @param id : id of the card
 * @param CardData : values that will be updated
 * @returns The card updated
 */
const update = async (id, CardData) => {
    const card = await Card.findByPk(id);
    if (!card || card.isDeleted) {
        return null;
    }

    return await card.update(CardData);
}

/**
 * Remove a specific card from the database
 * @param id : id of the card
 * @returns a boolean that indicates if the card was deleted
 */
const remove = async (id) => {
    const card = await Card.findByPk(id);
    if (!card || card.isDeleted) {
        return false;
    }

    await card.update({ isDeleted: true });
    return true;
}

/**
 * Get all the cards from the database
 * @returns : A list of the all cards
 */
const findAll = async () => {
    return await Card.findAll({
        where: {
            isDeleted: false
        }
    });
}

/**
 * Create a group of cards in the database
 * @param cards : cards that will be created
 * @returns : A list of the all created cards 
 */
const bulkCreate = async (cards) => {
    if (!cards) {
        throw new Error('cards cannot be null or empty');
    }
    
    if (!Array.isArray(cards)) {
        throw new Error('cards must be a list');
    }

    return await Card.bulkCreate(cards);
}

/**
 * Remove all the cards to clear the database
 */
const removeAll = async () => {
    await Card.destroy({
        where: {
            isDeleted: false
        }
    })
}

module.exports = {
    create,
    getById,
    update,
    remove,
    findAll,
    bulkCreate,
    removeAll
}