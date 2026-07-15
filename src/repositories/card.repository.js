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

module.exports = {
    create,
    getById,
    update,
    remove,
    findAll
}