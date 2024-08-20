const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserById, radarLocation, updateUserLocation, getAllUsers, updateMyProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { sendSecurityCode } = require('../controllers/tripController');

// Rutas para usuarios
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/:id', getUserById);
router.post('/get', getAllUsers);
router.post('/sendCode',[protect], sendSecurityCode);
router.post('/update',[protect], updateMyProfile);
router.post('/radar', [protect], radarLocation);
router.get('/updateLocation', updateUserLocation);



module.exports = router;
