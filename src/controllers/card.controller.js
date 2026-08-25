/**
 * Factory to create the card controller
 * @param cardService : dependency of card service
 * @returns a literal object that contains the functions of card controller
 */
const createCardController = (cardService) => {

    const createCards = async (req, res, next) => {
        /**
         * #swagger.tags = ['Cards']
         * #swagger.description = 'Initialize the cards of the original game'
        */
       const result = await cardService.initializeCards();
       if (!result.ok) {
           return next(result.error);
       }
       res.status(201).json({
           message: "cards created succesfully"
        });
    }
    
    const getAllCards = async (req, res, next) => {
        /**
         * #swagger.tags = ['Cards']
         * #swagger.description = 'Get all cards'
        */
       const cards = await cardService.getAllCards();
       if (!cards.ok) {
           return next(cards.error);
       }
       res.status(200).json(cards.result);
    }
    
    const getCardById = async (req, res, next) => {
        /**
         * #swagger.tags = ['Cards']
         * #swagger.description = 'Get a specific card based on the ID'
        */
       const { id } = req.params;
       const card = await cardService.findCardById(id);    
       if (!card.ok) {
           return next(card.error);
       }
       res.status(200).json(card.result);
    }
    
    return { createCards, getAllCards, getCardById, };
}

module.exports = createCardController;