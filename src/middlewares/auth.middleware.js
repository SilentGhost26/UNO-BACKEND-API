const tokenService = require('../services/token.service');

const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        const error = new Error('Token not entered');
        error.statusCode = 401;
        return next(error);
    }

    try {
        const decoded = tokenService.decodeValidToken(token);
        req.player = decoded;
        next();
    } catch (error) {
        error.statusCode = error.name === 'TokenExpiredError' ? 401 : 403;
        next(error);
    }
}

module.exports = validateToken;