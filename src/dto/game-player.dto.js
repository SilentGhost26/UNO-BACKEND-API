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
        name: data.Player.name,
        score: data.score
    }
}

const toGamePlayerInfoDto = (data) => {
    return {
        id: data.id,
        playerId: data.playerId,
        name: data.Player.name
    }
}

module.exports = {
    fromCreate,
    toResponseDto,
    toScoreResponseDto,
    toGamePlayerInfoDto,
}