const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const structureMiddleware = require('../middlewares/structure.middleware');
const playerSchema = require('../schemas/player.schema');

router.get('/players/:id', playerController.getPlayerById);
router.post('/players', structureMiddleware(playerSchema), playerController.addPlayer);
router.put('/players/:id', structureMiddleware(playerSchema), playerController.updatePlayer);
router.delete('/players/:id', playerController.deletePlayer);

module.exports = router;