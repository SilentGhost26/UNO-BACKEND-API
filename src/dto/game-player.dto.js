const fromCreate = (data) => {
    return {
        gameId: data.gameId,
        playerId: data.playerId
    }
}

const toResponseDto = (data) => {
    return {
        id: data.id,
        gameId: data.gameId,
        playerId: data.playerId,
        score: data.score
    }
}

const toScoreResponseDto = (data) => {
    return {
        id: data.id,
        gameId: data.gameId,
        playerId: data.playerId,
        score: data.score
    }
}

module.exports = {
    fromCreate,
    toResponseDto,
    toScoreResponseDto
}