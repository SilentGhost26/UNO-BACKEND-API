const { tokenService, playerService } = require('../../compositions');

const validateToken = async (socket, next) => {
    const authHeader = socket.handshake.auth?.token;

    if (!authHeader) {
        return next(new Error('no token provided'));
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
        const error = new Error('Token not entered');
        return next(error);
    }

    try {
        const decoded = tokenService.decodeValidToken(token);
        const logOutDate = await playerService.getLoggedOutDateByPlayerId(decoded.id);
        const iatDate = new Date(decoded.iat * 1000);
        if (logOutDate && logOutDate > iatDate) {
            const error = new Error('Invalid token: user session closed');
            error.data = { statusCode: 401 };
            return next(error);
        }
        socket.player = decoded;
        next();
    } catch (error) {
        error.statusCode = error.name === 'TokenExpiredError' ? 401 : 403;
        next(error);
    }
}

module.exports = validateToken;