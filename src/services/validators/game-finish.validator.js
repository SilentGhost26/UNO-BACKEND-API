const conflictHelper = require('../../helpers/conflict.helper');
const notFoundHelper = require('../../helpers/not-found.helper');
const { ok } = require('../../helpers/result.helper');

const gameMustExist = ({game, gameId}) => {
    if (!game) {
        return notFoundHelper.throwError404(gameId, 'game');
    }
    return ok();
}

const gameMustBePlaying = ({game, gameId}) => {
    if (game.status === 'WAITING') {
        return conflictHelper.throwError409(`game with ID ${gameId} it\'s not playing`);
    }
    if (game.status === 'FINISHED') {
        return conflictHelper.throwError409(`game with ID ${gameId} already finished`);
    }
    return ok();
}

const playerMustExist = ({player, playerId}) => {
    if (!player) {
        return notFoundHelper.throwError404(playerId, 'player');
    }
    return ok();
}

const playerMustBeOwner = ({ game, player, playerId }) => {
    if (game.ownerId != player.id) {
        return conflictHelper.throwError409(`player with ID ${playerId} is not the owner`);
    }
    return ok();
}

module.exports = [
    gameMustExist,
    gameMustBePlaying,
    playerMustExist,
    playerMustBeOwner
];