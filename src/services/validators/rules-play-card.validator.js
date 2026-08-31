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

const cardMathes = ({ card, lastCard, cardId, game }) => {
    if (lastCard.Card.type === 'NUMBER') {
        if (card.Card.color === game.currentColor || card.Card.value === lastCard.Card.value || card.Card.color === 'MULTICOLOR') {
            return ok();
        }
    } else {
        console.log(card.Card.color)
        if (card.Card.type === lastCard.Card.type || card.Card.color === game.currentColor || card.Card.color === 'MULTICOLOR') {
            return ok();
        }
    }
    return conflictHelper.throwError409(`card with ID ${cardId} does not matches`);
}

const cardFollowRules = ({ card, rules, lastCard, game }) => {
    if (!rules.allowDrawFour && card.Card.type === '+4') {
        return conflictHelper.throwError409(`+4 cards are not allowed`);
    }
    if (!rules.allowAccumulateDraw && 
        (card.Card.type === '+4' || card.Card.type === '+2') && 
        (lastCard.Card.type === '+4' || lastCard.Card.type === '+2')) {
        return conflictHelper.throwError409('It is not possible to accumulate draw cards');
    }
    if (!rules.allowReverse && card.Card.type === 'REVERSE') {
        return conflictHelper.throwError409('Reverse is forbidden');
    }
    return ok();
}

const notNeedDraw = ({ game, rules, playerId }) => {
    if (rules.canAccumulateDraw && game.mustDraw || !game.mustDraw) {
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