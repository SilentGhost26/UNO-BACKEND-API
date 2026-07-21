const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const playerSchema = require('../schemas/player.schema');
const loginSchema = require('../schemas/login.schema');

router.post('/auth/register', structureMiddleware(playerSchema), authController.registerPlayer);
router.post('/auth/login', structureMiddleware(loginSchema), authController.authenticatePlayer);
router.post('/auth/logout', authMiddleware, authController.logoutPlayer);

module.exports = router;