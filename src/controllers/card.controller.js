const { get } = require('../app');
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


const updateCard = async (req, res) => {
    /**
    * #swagger.tags = ['Cards']
    * #swagger.description = 'Update a specific card'
    * #swagger.parameters['body'] = {
       in: 'body',
       description: 'update a card',
       schema: { color: 'string', value: 'string', type: 'string' }
     }
    */
    const { id } = req.params;
    const card = await cardService.updateCard(id, req.body);
    res.status(200).json(card);
}
    
const deleteCard = async (req, res) => {
    /**
     * #swagger.tags = ['Cards']
     * #swagger.description = 'Remove a specific card'
     */
    const { id } = req.params;
    await cardService.deleteCard(id);
    res.status(204).send();
}

const addCard = async (req, res) => {
    /**
    * #swagger.tags = ['Cards']
    * #swagger.description = 'Add a new card'
    * #swagger.parameters['body'] = {
       in: 'body',
       description: 'Add a card',
       schema: { color: 'string', value: 'string', type: 'string' }
     }
    */
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