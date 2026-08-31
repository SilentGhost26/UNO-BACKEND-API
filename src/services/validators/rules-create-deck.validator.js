const { ok, err } = require('../../helpers/result.helper');

const validateDrawFourRule = ({ card, rules }) => {
    if (card.type === '+4' && !rules.allowDrawFour) {
        return err();
    }
    return ok();
}

const validateReverseRule = ({ card, rules }) => {
    if (card.type === `REVERSE` && !rules.allowReverse) {
        return err();
    }
    return ok();
}

module.exports = [
    validateDrawFourRule,
    validateReverseRule
];