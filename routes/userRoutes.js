const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserById, radarLocation, updateUserLocation, getAllUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Rutas para usuarios
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/:id', getUserById);
router.post('/get', getAllUsers);
router.post('/radar', [protect], radarLocation);
router.get('/updateLocation', updateUserLocation);



module.exports = router;
