const ok = (result) => { 
   return { ok: true, result }
}

const err = (error) => {
    return {ok: false, error}
}

const runValidators = (validators, context) => {
    return validators.reduce(
        (currentResult, validate) => currentResult.ok? validate(context) : currentResult, 
        ok(context)
    );
}

module.exports = { ok, err, runValidators };