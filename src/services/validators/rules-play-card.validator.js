const conflictHelper = require('../../helpers/conflict.helper');
const notFoundHelper = require('../../helpers/not-found.helper');
const { ok } = require('../../helpers/result.helper');

const existsGame = ({ game, gameId }) => {
    if (!game) {
        return notFoundHelper.throwError404(gameId, 'game');
    }
    return ok();
}

const existsCard = ({card, cardId}) => {
    if (!card) {
        return notFoundHelper.throwError404(cardId, 'card');
    }
    return ok();
}

const validateTurn = ({ currentPlayer, playerId }) => {
    if (playerId !== currentPlayer.playerId ) {
        return conflictHelper.throwError409(`it is not the turn of the player with ID ${playerId}`);
    }
    return ok();
}

const playerHasCard = ({ card, playerId, cardId }) => {
    if (card.playerId !== playerId) {
        return conflictHelper.throwError409(`card with ID ${cardId} is not in the hand`);
    }
    return ok();
}

const cardMathes = ({ card, lastCard, cardId, game, rules }) => {
    const isDrawCard = ['+2', '+4'].includes(card.Card.type);
    const isTopDrawCard = ['+2', '+4'].includes(lastCard.Card.type);

    if (game.mustDraw && rules.allowAccumulateDraw && isDrawCard && isTopDrawCard) {
        return ok();
    }

    if (lastCard.Card.type === 'NUMBER') {
        if (card.Card.color === lastCard.Card.color ||
            card.Card.value === lastCard.Card.value ||
            card.Card.color === 'MULTICOLOR') {
            return ok();
        }
    } else if (card.Card.type === lastCard.Card.type ||
        card.Card.color === game.currentColor ||
        card.Card.color === 'MULTICOLOR') {
        return ok();
    }
    return conflictHelper.throwError409(`card with ID ${cardId} does not matches`);
}

const cardFollowRules = ({ card, rules, lastCard, game }) => {
    if (!rules.allowDrawFour && card.Card.type === '+4') {
        return conflictHelper.throwError409(`+4 cards are not allowed`);
    }
    if (game.mustDraw && !rules.allowAccumulateDraw) {
        return conflictHelper.throwError409('It is not possible to accumulate draw cards');
    }
    if (!rules.allowReverse && card.Card.type === 'REVERSE') {
        return conflictHelper.throwError409('Reverse is forbidden');
    }
    return ok();
}

const notNeedDraw = ({ card, game, rules, playerId }) => {
    const isDrawCard = ['+2', '+4'].includes(card.Card.type);
    if (!game.mustDraw || (rules.allowAccumulateDraw && isDrawCard)) {
        return ok();
    }
    return conflictHelper.throwError409(`player with ID ${playerId} must draw`);
}

module.exports = [
    existsGame,
    existsCard,
    validateTurn,
    playerHasCard,
    cardMathes,
    cardFollowRules,
    notNeedDraw,
];
