const toResponseDto = (data) => {
    return {
        id: data.id,
        title: data.title,
        maxPlayers: data.maxPlayers,
        status: data.status,
        ownerId: data.ownerId,
        winnerId: data.winnerId,
        createdAt: data.createdAt,
        rules: {
            allowDrawFour: data.rules.allowDrawFour,
            allowAccumulateDraw: data.rules.allowAccumulateDraw,
            allowReverse: data.rules.allowReverse,
        }
    }
}

const toStatusResponseDto = (data) => {
    return {
        id: data.id,
        title: data.title,
        maxPlayers: data.maxPlayers,
        status: data.status,
        ownerId: data.ownerId,
        winnerId: data.winnerId,
        currentColor: data.currentColor,
        createdAt: data.createdAt,
    }
}


const fromCreateDto = (data) => {
    return {
        title: data.title,
        maxPlayers: data.maxPlayers,
        status: data.status,
        ownerId: data.ownerId,
        rules: data.rules,
    }
}

const fromUpdateDto = (data) => {
    return {
        title: data.title,
        maxPlayers: data.maxPlayers,
        status: data.status,
        rules: data.rules,
    }
}

module.exports = {
    toResponseDto,
    fromCreateDto,
    fromUpdateDto,
    toStatusResponseDto,
}