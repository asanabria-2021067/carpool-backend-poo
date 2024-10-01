const express = require('express');
const router = express.Router();
const { getUserTripHistory } = require('../controllers/tripHistoryController');
const { protect } = require('../middleware/authMiddleware');
const { getAllTrips } = require('../controllers/tripController');

// Rutas para historial de viajes
router.get('/myTrips',[protect], getUserTripHistory);
router.get('/get/trips', getAllTrips);


module.exports = router;
