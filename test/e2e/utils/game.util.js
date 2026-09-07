const fetchRequest = require('./request.util');

/**
 * Function to register and automatically login a player
 * @param namePrefix : Name that will use the new player
 * @returns A literal object that contains his email, token and id
 */
const registerAndLogin = async (namePrefix = 'player') => {
    const uniqueEmail = `${namePrefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}@test.com`;
    const password = 'Secret123!';

    const registerResponse = await fetchRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            name: namePrefix,
            age: 25,
            email: uniqueEmail,
            password
        })
    });

    if (registerResponse.status !== 201) {
        throw new Error(`Failed to register test player: ${JSON.stringify(registerResponse.body)}`);
    }

    const loginResponse = await fetchRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: uniqueEmail, password })
    });

    if (loginResponse.status !== 200) {
        throw new Error(`Failed to login test player: ${JSON.stringify(loginResponse.body)}`);
    }

    return {
        email: uniqueEmail,
        token: loginResponse.body.access_token,
        playerId: loginResponse.body.playerId
    };
};

const authHeader = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

/**
 * Function to initalize the available cards in the game.
 * Avoid the need of appling this during a test and avoid
 * problems with conflic states.
 */
const ensureCardCatalogInitialized = async () => {
    const response = await fetchRequest('/cards/initialize', { method: 'POST' });
    if (response.status !== 201 && response.status !== 409) {
        throw new Error(`Failed to initialize card catalog: ${JSON.stringify(response.body)}`);
    }
};

const createGame = (token, overrides = {}) => fetchRequest('/games', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({
        title: 'E2E test match',
        maxPlayers: 4,
        rules: { allowDrawFour: true, allowAccumulateDraw: false, allowReverse: true },
        ...overrides
    })
});

const joinGame = (gameId, token) => fetchRequest(`/games/${gameId}/players`, {
    method: 'POST',
    headers: authHeader(token)
});

const leaveGame = (gameId, token) => fetchRequest(`/games/${gameId}/players`, {
    method: 'DELETE',
    headers: authHeader(token)
});

const startGame = (gameId, token) => fetchRequest(`/games/${gameId}/start`, {
    method: 'PUT',
    headers: authHeader(token)
});

const finishGame = (gameId, token) => fetchRequest(`/games/${gameId}/end`, {
    method: 'PUT',
    headers: authHeader(token)
});

const createDeck = (gameId, token) => fetchRequest(`/games/${gameId}/cards`, {
    method: 'POST',
    headers: authHeader(token)
});

const distributeCards = (gameId, token, cardsPerPlayer = 7) => fetchRequest(`/games/${gameId}/distribute`, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ cardsPerPlayer })
});

// Section of GET requests. Uses cache busted path in order to avoid the data in cache and get always the last data
const cacheBustedPath = (path) => `${path}${path.includes('?') ? '&' : '?'}e2e=${Date.now()}_${Math.random()}`;

const getGameStatus = (gameId) => fetchRequest(cacheBustedPath(`/games/${gameId}/status`));

const getTopCard = (gameId) => fetchRequest(cacheBustedPath(`/games/${gameId}/cards/top-card`));

const getCurrentPlayer = (gameId) => fetchRequest(`/games/${gameId}/players/current`);

const getHand = (gameId, token) => fetchRequest(`/games/${gameId}/cards/hand`, {
    headers: authHeader(token)
});

const playCard = (gameId, token, cardId, newColor) => fetchRequest(`/games/${gameId}/play`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify({ cardId, newColor })
});

const drawCard = (gameId, token) => fetchRequest(`/games/${gameId}/draw`, {
    method: 'PUT',
    headers: authHeader(token)
});

const sayUno = (gameId, token) => fetchRequest(`/games/${gameId}/say-uno`, {
    method: 'PATCH',
    headers: authHeader(token)
});

const challengePlayer = (gameId, token, challengedPlayerId) => fetchRequest(`/games/${gameId}/challenge`, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ challengedPlayerId })
});

const getScoresByGame = (gameId) => fetchRequest(`/scores/games/${gameId}`);

/**
 * Function to find a playable card in a specific hand
 * Find the valid card following the rules to play a card
 * in order to simulate the selection of the valid card from 
 * the client side.
 * @param hand : Cards in the hand
 * @param topCard : The top card in the discard stack
 * @param currentColor the game's currentColor field
 * @returns the first playable card, or null if none is playable
 */
const findPlayableCard = (hand, topCard, currentColor) => {
    return hand.find((card) => {
        if (topCard.type === 'NUMBER') {
            return card.color === topCard.color ||
                card.value === topCard.value ||
                card.color === 'MULTICOLOR';
        }
        return card.type === topCard.type ||
            card.color === currentColor ||
            card.color === 'MULTICOLOR';
    }) || null;
};

module.exports = {
    registerAndLogin,
    authHeader,
    ensureCardCatalogInitialized,
    createGame,
    joinGame,
    leaveGame,
    startGame,
    finishGame,
    createDeck,
    distributeCards,
    getGameStatus,
    getTopCard,
    getCurrentPlayer,
    getHand,
    playCard,
    drawCard,
    sayUno,
    challengePlayer,
    getScoresByGame,
    findPlayableCard
};
