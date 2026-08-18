const cardService = require('../services/card.service');

const createCards = async (req, res) => {
    /**
     * #swagger.tags = ['Cards']
     * #swagger.description = 'Initialize the cards of the original game'
     */
    await cardService.initializeCards();
    res.status(201).json({
        message: "cards created succesfully"
    });
}

const getAllCards = async (req, res) => {
    /**
     * #swagger.tags = ['Cards']
     * #swagger.description = 'Get all cards'
     */
    const cards = await cardService.getAllCards();
    res.status(200).json(cards);
}

const getCardById = async (req, res) => {
    /**
     * #swagger.tags = ['Cards']
     * #swagger.description = 'Get a specific card based on the ID'
     */
    const { id } = req.params;
    const card = await cardService.findCardById(id);    
    res.status(200).json(card);
}
    
module.exports = {
    createCards,
    getAllCards,
    getCardById,
}