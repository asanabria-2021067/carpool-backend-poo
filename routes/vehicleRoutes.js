const express = require('express');
const router = express.Router();
const { createVehicle, getVehicleById, updateVehicle, deleteVehicle, getAllVehicles } = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

// Rutas para vehículos
router.get('/all', getAllVehicles);
router.post('/create',[protect], createVehicle);
router.get('/MyVehicle',[protect], getVehicleById);
router.put('/edit',[protect], updateVehicle);
router.delete('/:id',[protect], deleteVehicle);

module.exports = router;
