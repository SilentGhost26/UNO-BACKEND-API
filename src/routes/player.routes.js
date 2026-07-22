const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const playerSchema = require('../schemas/player.schema');

router.get('/players/me', authMiddleware, playerController.getProfile);
router.get('/players/:id', playerController.getPlayerById);
router.post('/players', structureMiddleware(playerSchema), playerController.addPlayer);
router.put('/players/:id', authMiddleware, structureMiddleware(playerSchema), playerController.updatePlayer);
router.delete('/players/:id', authMiddleware, playerController.deletePlayer);

module.exports = router;