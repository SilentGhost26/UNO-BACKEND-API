const fromCreateDto = (data) => {
    return {
        responseTime: data.responseTime,
        endpointAccess: data.endpointAccess,
        requestMethod: data.requestMethod,
        statusCode: data.statusCode,
        timestamp: data.timestamp,
        userId: data.userId,
    }
}

module.exports = {
    fromCreateDto,
}