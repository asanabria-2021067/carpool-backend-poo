const express = require('express');
const router = express.Router();
const { createTrip, getTripById, joinTrip, getAllTrips } = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

// Rutas para viajes
router.get('/get/trips', getAllTrips);
router.post('/create',[protect], createTrip);
router.get('/:id', getTripById);
router.post('/join',[protect], joinTrip);

module.exports = router;
