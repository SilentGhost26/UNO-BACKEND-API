const toResponseDto = (data) => {
    return {
        id: data.id,
        name: data.name,
        age: data.age,
        email: data.email,
        createdAt: data.createdAt
    }
}

const fromCreateDto = (data) => {
    return {
        name: data.name,
        age: data.age,
        email: data.email,
        password: data.password
    }
}

const fromUpdateDto = (data) => {
    return {
        name: data.name,
        age: data.age,
        email: data.email
    }
}

module.exports = {
    toResponseDto,
    fromCreateDto,
    fromUpdateDto
}