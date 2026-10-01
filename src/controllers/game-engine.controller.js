const publisher = require('../websocket/publish');

const createGameEngineController = (
    gameEngineService,
    launchGameService,
) => {
    const launchGame = async (req, res, next) => {
        const { gameId } = req.params;
        const result = await launchGameService.launchGame(gameId, req.player.id, req.body.cardsPerPlayer);
        if (!result.ok) return next(result.error);
        res.status(200).json(result.result);
        publisher.gameUpdated(gameId);
        publisher.lobbyUpdated();
    }

    const distributeCards = async (req, res, next) => {
        const { gameId } = req.params;
        const cardsPerPlayer = req.body.cardsPerPlayer;
        const distributedCards = await gameEngineService.distributeCards(gameId, cardsPerPlayer);
        if (!distributedCards.ok) {
            return next(distributedCards.error);
        }
        
        res.status(201).json({
            message: "Cards distributed succesfully",
            players: distributedCards.result,
        });
        publisher.gameUpdated(gameId);
    }

    const playCard = async (req, res, next) => {
        const playerId = req.player.id;
        const { gameId } = req.params;
        const { cardId, newColor } = req.body;

        const action = await gameEngineService.playCard(playerId, gameId, cardId, newColor);
        if (!action.ok) {
            return next(action.error);
        }

        res.status(200).json(action.result);
        publisher.gameUpdated(gameId);
        if (action.result?.winner) publisher.lobbyUpdated();
    }

    const drawCard = async (req, res, next) => {
        const playerId = req.player.id;
        const { gameId } = req.params;

        const action = await gameEngineService.drawCard(gameId, playerId);
        if (!action.ok) {
            return next(action.error);
        }
        res.status(200).json(action.result);
        publisher.gameUpdated(gameId);
    }

    const sayUno = async (req, res, next) => {
        const playerId = req.player.id;
        const { gameId } = req.params;

        const action = await gameEngineService.sayUno(gameId, playerId);
        if (!action.ok) {
            return next(action.error);
        }
        res.status(200).json(action.result);
        publisher.gameUpdated(gameId);
    }

    const challengePlayer = async(req, res, next) => {
        const playerIdChallenging = req.player.id;
        const { gameId } = req.params;
        const { challengedPlayerId } = req.body;
        const action = await gameEngineService.challengePlayer(gameId, challengedPlayerId, playerIdChallenging);
        if (!action.ok) {
            return next(action.error);
        }
        res.status(200).json(action.result);
        publisher.gameUpdated(gameId);
    }
    return { launchGame, distributeCards, playCard, drawCard, sayUno, challengePlayer }
}

module.exports = createGameEngineController;
