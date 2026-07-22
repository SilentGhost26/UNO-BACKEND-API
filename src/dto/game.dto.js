const toResponseDto = (data) => {
    return {
        id: data.id,
        title: data.title,
        maxPlayers: data.maxPlayers,
        status: data.status,
        ownerId: data.ownerId,
        winnerId: data.winnerId,
        createdAt: data.createdAt
    }
}

const fromCreateDto = (data) => {
    return {
        title: data.title,
        maxPlayers: data.maxPlayers,
        status: data.status,
        ownerId: data.ownerId
    }
}

const fromUpdateDto = (data) => {
    return {
        title: data.title,
        maxPlayers: data.maxPlayers,
        status: data.status,
    }
}

module.exports = {
    toResponseDto,
    fromCreateDto,
    fromUpdateDto
}