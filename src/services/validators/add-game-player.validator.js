const conflictHelper = require('../../helpers/conflict.helper');
const notFoundHelper = require('../../helpers/not-found.helper');
const { ok } = require('../../helpers/result.helper');

const playerMustExist = ({player, playerId}) => {
    if (!player) {
        return notFoundHelper.throwError404(playerId, 'player');
    }
    return ok();
}

const gameMustExist = ({game, gameId}) => {
    if (!game) {
       return notFoundHelper.throwError404(gameId, 'game');
    }
    return ok();
}

const playerIsNotPlaying = ({playingPlayer, playerId, gameId}) => {
    if (playingPlayer) {
        return conflictHelper.throwError409(`player with ID ${playerId} already registered ` +
            `in game with ID ${gameId}`);
    }
    return ok();
}

const gameMustBePlaying = ({game, gameId}) => {
    if (game.status !== 'WAITING') {
        return conflictHelper.throwError409(`Game with ID ${game.id} is not in waiting state`);
    }
    return ok();
}

const mustThereAvailableSpaceInGame = ({currentPlayers, game}) => {
    if (game.maxPlayers == currentPlayers.length) {
        return conflictHelper.throwError409(`The game with ID ${game.id} is full`);
    }
    return ok();
}

module.exports = [
    playerMustExist,
    gameMustExist,
    playerIsNotPlaying,
    gameMustBePlaying,
    mustThereAvailableSpaceInGame
];