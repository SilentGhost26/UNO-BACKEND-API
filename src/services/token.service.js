const jwt = require('jsonwebtoken');

const createUserToken = (userId) => {
    return jwt.sign(
        {
        id: userId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '24h'
        }
    );
}

const decodeValidToken = (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { complete: true });
    return decoded.payload;
}

module.exports = {
    createUserToken,
    decodeValidToken
}