const { get } = require('../app');
const cardService = require('../services/card.service');

const createCards = async (req, res) => {
    await cardService.initializeCards();
    res.status(201).json({
        message: "cards created succesfully"
    });
}

const getAllCards = async (req, res) => {
    const cards = await cardService.getAllCards();
    res.status(200).json(cards);
}

const getCardById = async (req, res) => {
    const { id } = req.params;
    const card = cardService.findCardById(id);
    res.status(200).json(card);
}

const updateCard = async (req, res) => {
    const { id } = req.params;
    const card = await cardService.updateCard(id, req.body);
    res.status(200).json(card);
}
    
const deleteCard = async (req, res) => {
    const { id } = req.params;
    await cardService.deleteCard(id);
    res.status(204).send();
}

const addCard = async (req, res) => {
    const card = await cardService.addCard(req.body);
    res.status(201).json(card);
}

module.exports = {
    createCards,
    getAllCards,
    getCardById,
    updateCard,
    deleteCard,
    addCard
}