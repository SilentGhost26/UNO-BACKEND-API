const express = require('express');
const router = express.Router();
const { playerController } = require('../compositions');
const structureMiddleware = require('../middlewares/structure.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const playerSchema = require('../schemas/player.schema');

router.get('/players/me', authMiddleware, playerController.getProfile);
router.get('/players/:id', playerController.getPlayerById);
router.put('/players', authMiddleware, structureMiddleware(playerSchema), playerController.updatePlayer);
router.delete('/players', authMiddleware, playerController.deletePlayer);

module.exports = router;