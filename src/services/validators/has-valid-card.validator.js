const conflictHelper = require('../../helpers/conflict.helper');
const { ok, err } = require('../../helpers/result.helper');

const thereValidCard = ({ hand, lastCard, game }) => {
    const thereValid = hand.some(card => {
        if (lastCard.Card.type === 'NUMBER') {
            if (card.Card.color === lastCard.Card.color || card.Card.value === lastCard.Card.value || card.Card.color === 'MULTICOLOR') {
                return true;
            }
        } else {
            if (card.Card.type === lastCard.Card.type || (card.Card.type === '+2' && lastCard.Card.type === '+4') || (card.Card.type === '+4' && lastCard.Card.type === '+2')) {
                return true;
            } else if (card.Card.color === game.currentColor || card.Card.color === 'MULTICOLOR') {
                return true;
            }
        }
        return false;
    });
    return thereValid? ok() : err();
}

const canAccumulateDraw = ({ rules, lastCard, game }) => {
    if (!rules.allowAccumulateDraw && (lastCard.Card.type === '+2' || lastCard.Card.type === '+4') && game.mustDraw) {
        return err();
    }
    return ok();
}

const notNeedDraw = ({ game, rules }) => {
    if (rules.canAccumulateDraw && game.mustDraw || !game.mustDraw) {
        return ok();
    }
    return err();
}

module.exports = [
    thereValidCard,
    canAccumulateDraw,
    notNeedDraw
];