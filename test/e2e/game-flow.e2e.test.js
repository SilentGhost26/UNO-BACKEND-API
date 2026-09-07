const {
    registerAndLogin,
    ensureCardCatalogInitialized,
    createGame,
    joinGame,
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
    findPlayableCard
} = require('./utils/game.util');

describe('E2E: Core UNO game workflow', () => {
    let owner;
    let guest;
    let gameId;

    beforeAll(async () => {
        await ensureCardCatalogInitialized();
        owner = await registerAndLogin('owner');
        guest = await registerAndLogin('guest');
    });

    describe('Workflow of the game creation', () => {
        test('POST /games creates a game in WAITING state and registers the owner as a player', async () => {
            const response = await createGame(owner.token);
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.status).toBe('WAITING');
            expect(response.body.ownerId).toBe(owner.playerId);
            expect(response.body.rules).toEqual({
                allowDrawFour: true,
                allowAccumulateDraw: false,
                allowReverse: true
            });
            
            gameId = response.body.id;
            
            // side effect: the owner is already registered as a game player (position 1)
            const statusResponse = await getGameStatus(gameId);
            expect(statusResponse.status).toBe(200);
            expect(statusResponse.body.players).toHaveLength(1);
            expect(statusResponse.body.players[0].playerId).toBe(owner.playerId);
        });
        
        test('POST /games fails without a token', async () => {
            const response = await createGame(null);
            expect(response.status).toBe(401);
        });
        
        test('POST /games fails validation with a title that is too short', async () => {
            const response = await createGame(owner.token, { title: 'ab' });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('details');
        });
        
    });

    describe('Workflow of joining into a game', () => {
        test('POST /games/:gameId/players lets a second player join', async () => {
            const response = await joinGame(gameId, guest.token);
            
            expect(response.status).toBe(201);
            expect(response.body.playerId).toBe(guest.playerId);
            expect(response.body.gameId).toBe(gameId);
            
            // side effect: the game now has 2 players
            const statusResponse = await getGameStatus(gameId);
            expect(statusResponse.body.players).toHaveLength(2);
        });
        
        test('POST /games/:gameId/players fails if the same player tries to join twice', async () => {
            const response = await joinGame(gameId, guest.token);
            expect(response.status).toBe(409);
        });
    });
        
    describe('workflow of starting the game', () => {
        test('PUT /games/:id/start fails when a non-owner tries to start it', async () => {
            const response = await startGame(gameId, guest.token);
            expect(response.status).toBe(409);
        });
        
        test('PUT /games/:id/start starts the game once there are 2+ players and the owner requests it', async () => {
            const response = await startGame(gameId, owner.token);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Game started succesfully');
            
            // side effect: the game's status changed to PLAYING
            const statusResponse = await getGameStatus(gameId);
            expect(statusResponse.body.game.status).toBe('PLAYING');
        }); 
    });

    describe('workflow of building the deck and dealing hands', () => {
        test('POST /games/:gameId/cards builds the 108-card deck for this game', async () => {
            const response = await createDeck(gameId, owner.token);
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Deck created succesfully');
        });
        
        test('POST /games/:gameId/distribute deals 7 cards to every player (side effect: hands are non-empty)', async () => {
            const response = await distributeCards(gameId, owner.token, 7);
            
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Cards distributed succesfully');
            expect(response.body.players).toHaveLength(2);
            response.body.players.forEach((p) => {
                expect(p.cards).toHaveLength(7);
            });
            
            // side effect: each player's private hand endpoint reflects the same 7 cards
            const ownerHand = await getHand(gameId, owner.token);
            expect(ownerHand.status).toBe(200);
            expect(ownerHand.body.hand).toHaveLength(7);
            
            const guestHand = await getHand(gameId, guest.token);
            expect(guestHand.body.hand).toHaveLength(7);
        });
        
        test('POST /games/:gameId/distribute cannot be called twice for the same game', async () => {
            const response = await distributeCards(gameId, owner.token, 7);
            expect(response.status).toBe(409);
        });
    });
        
    describe('Workflow of playing a move', () => {
        test('PUT /games/:gameId/play (or draw as a fallback) advances the turn', async () => {
            const topCardResponse = await getTopCard(gameId);
            expect(topCardResponse.status).toBe(200);
            
            const statusResponse = await getGameStatus(gameId);
            const currentColor = statusResponse.body.game.currentColor;
            
            const handResponse = await getHand(gameId, owner.token);
            const playableCard = findPlayableCard(handResponse.body.hand, topCardResponse.body.topCard, currentColor);
            
            if (playableCard) {
                const newColor = playableCard.color === 'MULTICOLOR' ? 'RED' : undefined;
                const response = await playCard(gameId, owner.token, playableCard.id, newColor);
                
                expect(response.status).toBe(200);
                expect(['Card played', 'Player won the game']).toContain(response.body.action);
                
                // side effect: the new top card in the discard stack must be the just played
                const newTopCard = await getTopCard(gameId);
                expect(newTopCard.body.topCard.id).toBe(playableCard.id);
            } else {
                const response = await drawCard(gameId, owner.token);
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('drawnCards');
            }
        });
        
        test('PUT /games/:gameId/play rejects a player who is not the current turn', async () => {
            const currentPlayerResponse = await getCurrentPlayer(gameId);
            expect(currentPlayerResponse.status).toBe(200);
            
            const isOwnerTurn = currentPlayerResponse.body.player.playerId === owner.playerId;
            const outOfTurnPlayer = isOwnerTurn ? guest : owner;
            const handResponse = await getHand(gameId, outOfTurnPlayer.token);
            expect(handResponse.status).toBe(200);
            expect(handResponse.body.hand).not.toHaveLength(0);
            
            const response = await playCard(gameId, outOfTurnPlayer.token, handResponse.body.hand[0].id);
            expect(response.status).toBe(409);
        }); 
    });

    describe('Workflow of finishing a game', () => {
        test('PUT /games/:id/end fails when a non-owner tries to finish it', async () => {
            const response = await finishGame(gameId, guest.token);
            expect(response.status).toBe(409);
        });
        
        test('PUT /games/:id/end lets the owner finish the game', async () => {
            const response = await finishGame(gameId, owner.token);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Game ended succesfully');
            
            // side effect: game status is now FINISHED
            const statusResponse = await getGameStatus(gameId);
            expect(statusResponse.body.game.status).toBe('FINISHED');
        });
        
        test('PUT /games/:id/end cannot be called again on an already finished game', async () => {
            const response = await finishGame(gameId, owner.token);
            expect(response.status).toBe(409);
        });
    });
});
