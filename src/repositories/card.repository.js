const Card = require('../models/card.model');

const create = async (cardData) => {
    return await Card.create(cardData);
}

const getById = async (id) => {
    const card = await Card.findByPk(id);
    if(!card || card.isDeleted) {
        return null;
    }

    return card;
}

const update = async (id, CardData) => {
    const card = await Card.findByPk(id);
    if (!card || card.isDeleted) {
        return null;
    }

    return await card.update(CardData);
}

const remove = async (id) => {
    const card = await Card.findByPk(id);
    if (!card || card.isDeleted) {
        return false;
    }

    await card.update({ isDeleted: true });
    return true;
}

const findAll = async () => {
    return await Card.findAll({
        where: {
            isDeleted: false
        }
    });
}

const bulkCreate = async (cards) => {
    if (!cards) {
        throw new Error('cards cannot be null or empty');
    }
    
    if (!Array.isArray(cards)) {
        throw new Error('cards must be a list');
    }

    return await Card.bulkCreate(cards);
}

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