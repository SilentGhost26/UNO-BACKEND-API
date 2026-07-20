const gameCardRepository = require('../repositories/game-card.repository');
const gameRepository = require('../repositories/game.repository');
const cardRepository = require('../repositories/card.repository');
const playerRepository = require('../repositories/player.repository');
const gameCardDto = require('../dto/game-card.dto');
const notFoundHelper = require('../helpers/not-found.helper');

/**
 * Initialize the deck that will be used by a specific game
 * @param gameId : id of the game
 */
const createDeck = async (gameId) => {
    const game = await gameRepository.getById(gameId);
    if (!game) {
        notFoundHelper.throwError404(gameId, 'game');
    }
    const createdDeck = await gameCardRepository.getByGameId(gameId);
    console.log(createdDeck)
    if (createdDeck.length !== 0) {
        const error = new Error(`Game with ID ${gameId} already has a deck`);
        error.statusCode = 409;
        throw error;
    }

    const cards = await cardRepository.findAll();
    const deck = [];
    cards.forEach(c => {
        deck.push({ zone: 'DECK', gameId: gameId, cardId: c.id})
    });
    
    const positions = getRandomNumbers(1, cards.length);
    
    for (i = 0; i < deck.length; i++) {
        deck[i].position = positions[i];
    }

    await gameCardRepository.bulkCreate(deck);
}

/**
 * get the gameCards that are in a specific game
 * @param gameId : id of the game
 * @returns A list of found gameCards
 */
const getByGameId = async (gameId) => {
    const game = await gameRepository.getById(gameId);
    if (!game) {
        notFoundHelper.throwError404(gameId, 'game');
    }

    const gameCards = await gameCardRepository.getByGameId(gameId);
    return gameCards.toSorted((a, b) => a.position - b.position)
    .map(g => gameCardDto.toGameCardResponseDto(g));
}

const updateGameCard = async (gameId, cardId, gameCardData) => {
    const game = await gameRepository.getById(gameId);
    if (!game) {
        notFoundHelper.throwError404(gameId, 'game');
    }
    
    const card = await cardRepository.getById(cardId) 
    if (!card) {
        notFoundHelper.throwError404(cardId, 'card');
    }

    const playerId = gameCardData.playerId || null;

    if(playerId) {
        if (gameCardData.zone != 'HAND') {
            playerId = null;
        } else {
            const player = await playerRepository.getFromSpecificGame(playerId, gameId);
            if (!player) {
                notFoundHelper.throwError404(playerId, 'player in game');
            }
        }
    }

    if (game.status != 'PLAYING') {
        const error = new Error(`game with ID ${gameId} is not playing`);
        error.statusCode = 400;
        throw error;
    }

    const newData = {...gameCardData, playerId: playerId};
    if (gameCardData.zone != 'DECK') {
        newData.position = null;
    }

    const updatedGameCard = await gameCardRepository.update(gameId, cardId, newData);
    return gameCardDto.toGameCardResponseDto(updatedGameCard);
}

/**
 * Function to get a list of random number without repetition between a range
 * @param min : minimum value of the numbers 
 * @param max : maximum value of the numbers
 * @returns a list of the generated numbers
 */
function getRandomNumbers(min, max) {
    const results = [];
    while (results.length < max) {
        const value = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!results.includes(value)) {
            results.push(value);
        }
    }
    return results;
}



module.exports = {
    createDeck,
    getByGameId,
    updateGameCard
}
