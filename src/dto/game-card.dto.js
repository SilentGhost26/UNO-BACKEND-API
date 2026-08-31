const toGameCardResponseDto = (data) => {
    return {
        gameId: data.gameId,
        cardId: data.cardId,
        zone: data.zone,
        position: data.position,
        playerId: data.playerId,
    }
}

const toHandResponseDto = (data) => {
    return {
        playerId: data.playerId,
        cards: data.cardsInHand,
    }
}

module.exports = {
    toGameCardResponseDto,
    toHandResponseDto
}