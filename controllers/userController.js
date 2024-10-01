const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generarJWT } = require('../helpers/generarJWT');
const Trip = require('../models/Trip');

// Registro de usuario
const registerUser = async (req, res) => {
  const { firstName, lastName, studentId, email, password, phone, latitude, longitude, img, licence, role } = req.body;

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
      phone,
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
          phone: user.phone,
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

const updateMyProfile = async (req, res) => {
  const { firstName, lastName, studentId, email, password, phone, img, licence, role, longitude, latitude } = req.body;
  const id = req.usuario.id;

  try {
    const Usuario = await User.findById(id);
    if (!Usuario) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userWithSameEmail = await User.findOne({ email });

    if (userWithSameEmail && userWithSameEmail.id !== id) {
      return res.status(400).json({ message: 'Email already in use by another user' });
    }

    // Hash the password if it is provided
    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Update user information
    Usuario.firstName = firstName || Usuario.firstName;
    Usuario.lastName = lastName || Usuario.lastName;
    Usuario.studentId = studentId || Usuario.studentId;
    Usuario.email = email || Usuario.email;
    Usuario.phone = phone || Usuario.phone;
    Usuario.password = hashedPassword || Usuario.password;
    Usuario.img = img || Usuario.img;
    Usuario.licence = licence || Usuario.licence;
    Usuario.role = role || Usuario.role;
    Usuario.location = { type: 'Point', coordinates: [longitude, latitude] } || Usuario.location;

    await Usuario.save();

    return res.status(200).json({
      user: {
        id: Usuario._id,
        firstName: Usuario.firstName,
        lastName: Usuario.lastName,
        studentId: Usuario.studentId,
        email: Usuario.email,
        phone: Usuario.phone,
        location: Usuario.location,
        img: Usuario.img,
        licence: Usuario.licence,
        role: Usuario.role
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};


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

    // Obtener coordenadas de la solicitud
    const { latitude, longitude } = req.body; // Suponiendo que envías latitud y longitud desde el frontend

    if (latitude && longitude) {
      // Verificar que sean números válidos
      if (!isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
        // Actualizar la ubicación del usuario en la base de datos
        user.location = {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)] // Longitude first, then Latitude
        };

        await user.save(); // Guardar la nueva ubicación en la base de datos
      }
    }

    const token = await generarJWT(user.id, user.role);

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
        role: user.role,
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
  
  // Definir `now` como la fecha y hora actuales
  const now = new Date();

  // Definir el límite de 5 horas antes
  const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

  // Filtrar los viajes del conductor que empiezan hoy y no antes de 5 horas
  const tideDriver = await Trip.find({
    startTime: {
      $gte: fiveHoursAgo,  // Viajes que comiencen después de hace 5 horas
      $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)  // Viajes solo del día de hoy
    }
  }).sort({ startTime: 1 }).limit(5);

  // Validar si el conductor tiene viajes
  if (!tideDriver.length) {
    return res.status(404).json({ message: 'No trips found for the driver' });
  }

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
  const deltaLongitude = 10 / kmInLongitudeDegree;
  const deltaLatitude = 10 / kmInLatitudeDegree;

  try {
    // Buscar conductores en un radio de 10 km, si tienen un viaje activo
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
    }).select('-password').limit(5);  // Limitar la consulta a un máximo de 5 resultados

    if (!users.length) {
      return res.status(404).json({ message: 'No users found within approximately 10 km radius' });
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
  getAllUsers,
  updateMyProfile
};
