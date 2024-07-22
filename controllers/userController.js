const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generarJWT } = require('../helpers/generarJWT');

// Registro de usuario
const registerUser = async (req, res) => {
  const { firstName, lastName, studentId, email, password, latitude, longitude, img, licence, role } = req.body;

  if (!latitude || !longitude || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ message: 'Invalid coordinates' });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      studentId,
      email,
      password: hashedPassword,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      img,
      licence,
      role
    });

    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '10h',
      });

      return res.status(201).json({
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
          email: user.email,
          location: user.location,
          img: user.img,
          licence: user.licence,
          role: user.role
        },
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Inicio de sesión de usuario
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = await generarJWT( user.id, user.role );

    return res.json({
      token,
      user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
          email: user.email,
          location: user.location,
          img: user.img,
          licence: user.licence,
          role: user.role
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
    const users = await User.find().select('-password');
    if (!users) {
      return res.status(404).json({ message: 'No users found' });
    }
    res.json(users);
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Buscar usuarios en un radio de 1 km
const radarLocation = async (req, res) => {
  const id = req.usuario.id;
  const Usuario = await User.findById(id);
  if (!Usuario.location.coordinates || !Usuario.location.coordinates.length) {
    return res.status(400).json({ message: 'Coordinates are required' });
  }

  const longitude = parseFloat(Usuario.location.coordinates[0]);
  const latitude = parseFloat(Usuario.location.coordinates[1]);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: 'Coordinates must be numeric' });
  }

  // Aproximación de 1 km en grados (varía según la latitud)
  const kmInLongitudeDegree = 111.32 * Math.cos(latitude * (Math.PI / 180));
  const kmInLatitudeDegree = 111.32;
  const deltaLongitude = 1 / kmInLongitudeDegree;
  const deltaLatitude = 1 / kmInLatitudeDegree;

  try {
    const users = await User.find({
      location: {
        $geoWithin: {
          $box: [
            [longitude - deltaLongitude, latitude - deltaLatitude],
            [longitude + deltaLongitude, latitude + deltaLatitude]
          ]
        }
      },
      role: 'Conductor'
    }).select('-password');

    if (!users.length) {
      return res.status(404).json({ message: 'No users found within approximately 1 km radius' });
    }
    res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

const updateUserLocation = async (req, res) => {
  const userId = req.usuario.id;
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ message: 'Invalid coordinates' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };

    await user.save();

    return res.json({ message: 'Location updated successfully', user });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  radarLocation,
  updateUserLocation,
  getAllUsers
};
