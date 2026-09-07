const { ok, err } = require('../../helpers/result.helper');

const thereValidCard = ({ hand, lastCard, game, rules }) => {
    if (game.mustDraw && !rules.allowAccumulateDraw) {
        return err();
    }

    const thereValid = hand.some(card => {
        if (game.mustDraw) {
            const isDrawCard = ['+2', '+4'].includes(card.Card.type);
            const isTopDrawCard = ['+2', '+4'].includes(lastCard.Card.type);
            return isDrawCard && isTopDrawCard;
        }

        if (lastCard.Card.type === 'NUMBER') {
            return card.Card.color === lastCard.Card.color ||
                card.Card.value === lastCard.Card.value ||
                card.Card.color === 'MULTICOLOR';
        }

        return card.Card.type === lastCard.Card.type ||
            card.Card.color === game.currentColor ||
            card.Card.color === 'MULTICOLOR';
    });
    return thereValid? ok() : err();
}

module.exports = [
    thereValidCard,
];
