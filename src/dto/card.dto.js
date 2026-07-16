const toResponseDto = (data) => {
    return {
        id: data.id,
        color: data.color,
        value: data.value,
        type: data.type
    }
}

const fromCreate = (data) => {
    return {
        color: data.color,
        value: data.value,
        type: data.type
    }
}

const fromUpdate = (data) => {
    return {
        color: data.color,
        value: data.value,
        type: data.type
    }
}
module.exports = {
    toResponseDto,
    fromCreate,
    fromUpdate
}