const { tokenService, playerService } = require('../compositions');

//Validates if the jwt token is a valid token and the owner of the token (player)
//has not logged out
const validateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
        const error = new Error('Token not entered');
        error.statusCode = 401;
        return next(error);
    }

    try {
        const decoded = tokenService.decodeValidToken(token);
        const logOutDate = await playerService.getLoggedOutDateByPlayerId(decoded.id);
        const iatDate = new Date(decoded.iat * 1000);
        if (logOutDate && logOutDate > iatDate) {
            return res.status(401).json({
                message: 'Invalid token: user session closed'
            });
        }
        req.player = decoded;
        next();
    } catch (error) {
        error.statusCode = error.name === 'TokenExpiredError' ? 401 : 403;
        next(error);
    }
}

module.exports = validateToken;