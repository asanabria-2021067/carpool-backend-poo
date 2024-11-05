const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserById, radarLocation, updateUserLocation, getAllUsers, updateMyProfile, concludeProfile, acceptPassenger, cancelPassenger, cancelTripByDriver, joinTrip, deleteUserByAdmin, editUserByAdmin } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { sendSecurityCode } = require('../controllers/tripController');

// Rutas para usuarios
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/:id', getUserById);
router.put('/:id', concludeProfile);
router.post('/get', getAllUsers);
router.post('/sendCode',[protect], sendSecurityCode);
router.post('/update', [protect], updateMyProfile);
router.post('/join', [protect], joinTrip);
router.post('/radar', [protect], radarLocation);
router.get('/updateLocation', updateUserLocation);
router.post('/accept',  [protect], acceptPassenger);
router.post('/cancel/passenger',  [protect], cancelPassenger);
router.post('/cancel/driver',  [protect], cancelTripByDriver);
router.delete('/user/:id', [protect], deleteUserByAdmin);
router.post('/user/:id', [protect], editUserByAdmin);


module.exports = router;
