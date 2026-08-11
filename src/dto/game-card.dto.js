const toGameCardResponseDto = (data) => {
    return {
        gameId: data.gameId,
        cardId: data.cardId,
        zone: data.zone,
        position: data.position,
        playerId: data.playerId,
    }
}

module.exports = {
    toGameCardResponseDto
}