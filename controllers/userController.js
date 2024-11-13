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
      
      return res.status(201).json({
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

const concludeProfile = async(req, res) => {
  const {studentId, phone, img, licence, role } = req.body;
  const id = req.params.id;
  try {
    const Usuario = await User.findById(id);
    if (!Usuario) {
      return res.status(404).json({ message: 'User not found' });
    }
    Usuario.studentId = studentId || Usuario.studentId;
    Usuario.phone = phone || Usuario.phone;
    Usuario.img = img || Usuario.img;
    Usuario.licence = licence || Usuario.licence;
    Usuario.role = role || Usuario.role;
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

}

const updateMyProfile = async (req, res) => {
  
  const { firstName, lastName, studentId, email, password, phone, img, licence, role, longitude, latitude } = req.body;
  const id = req.usuario.id;
    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (email && email !== usuario.email) {
      const userWithSameEmail = await User.findOne({ email });
      if (userWithSameEmail && userWithSameEmail._id.toString() !== id) {
        return res.status(400).json({ message: 'El correo ya está en uso por otro usuario' });
      }
      usuario.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(password, salt);
    }

    // Actualización de los datos del usuario
    usuario.firstName = firstName || usuario.firstName;
    usuario.lastName = lastName || usuario.lastName;
    usuario.studentId = studentId || usuario.studentId;
    usuario.phone = phone || usuario.phone;
    usuario.img = img || usuario.img;
    usuario.licence = licence || usuario.licence;
    usuario.role = role || usuario.role;

    if (longitude && latitude) {
      usuario.location = { type: 'Point', coordinates: [longitude, latitude] };
    }

    await usuario.save();

    return res.status(200).json({
      user: {
        id: usuario._id,
        firstName: usuario.firstName,
        lastName: usuario.lastName,
        studentId: usuario.studentId,
        email: usuario.email,
        phone: usuario.phone,
        location: usuario.location,
        img: usuario.img,
        licence: usuario.licence,
        role: usuario.role,
      },
      message: 'Perfil actualizado con éxito'
    });
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

const radarLocation = async (req, res) => {
  try {
    const id = req.usuario.id;
    const Usuario = await User.findById(id);

    if (!Usuario || !Usuario.location || !Usuario.location.coordinates || !Usuario.location.coordinates.length) {
      return res.status(400).json({ message: 'Coordinates are required' });
    }

    const longitude = parseFloat(Usuario.location.coordinates[0]);
    const latitude = parseFloat(Usuario.location.coordinates[1]);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: 'Coordinates must be numeric' });
    }

    const now = new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const kmInLongitudeDegree = 111.32 * Math.cos(latitude * (Math.PI / 180));
    const kmInLatitudeDegree = 111.32;
    const deltaLongitude = 20 / kmInLongitudeDegree;
    const deltaLatitude = 20 / kmInLatitudeDegree;

    // Buscar conductores cercanos
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
    }).select('-password').limit(5);

    if (!users.length) {
      return res.status(404).json({ message: 'No nearby drivers found within 1 km radius' });
    }

    // Buscar viajes activos para cada conductor
    const driversWithTrips = await Promise.all(
      users.map(async (driver) => {
        const trips = await Trip.find({
          driver: driver._id,
          $or: [
            { startTime: { $gte: fiveHoursAgo, $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) } },
            { startTime: null }  // Esta línea permite que los conductores sin viajes activos aún aparezcan
          ]
        })
        .populate('driver', 'firstName lastName img')
        .populate('passengers', 'firstName lastName')
        .populate('vehicle', 'plateNumber model carImage')
        .sort({ startTime: 1 })
        .limit(5);

        return { driver, trips };
      })
    );

    const nearbyDriversWithActiveTrips = driversWithTrips.filter(({ trips }) => trips.length > 0);

    if (!nearbyDriversWithActiveTrips.length) {
      return res.status(404).json({ message: 'No nearby drivers with active trips found' });
    }

    res.json(nearbyDriversWithActiveTrips);
  } catch (error) {
    console.error("Error in radarLocation:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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

// Aceptar un pasajero en el viaje
const acceptPassenger = async (req, res) => {
  const { tripId, passengerId } = req.body; // Se espera que el cuerpo contenga tripId y passengerId

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const passengerStatus = trip.passengersStatus.find(status => status.passengerId.equals(passengerId));

    if (!passengerStatus) {
      return res.status(404).json({ message: 'Passenger not found in this trip' });
    }

    passengerStatus.accepted = true;
    trip.seatsAvailable -= 1; // Reducir los asientos disponibles
    await trip.save();

    return res.status(200).json({ message: 'Passenger accepted successfully', trip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Cancelar el viaje por parte del pasajero
const cancelPassenger = async (req, res) => {
  const { tripId } = req.body; // Se espera que el cuerpo contenga tripId
  const userId = req.usuario.id; // ID del usuario a partir del JWT

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const passengerStatus = trip.passengersStatus.find(status => status.passengerId.equals(userId));

    if (!passengerStatus) {
      return res.status(404).json({ message: 'Passenger not found in this trip' });
    }

    if (passengerStatus.canceled) {
      return res.status(400).json({ message: 'Passenger has already canceled the trip' });
    }

    passengerStatus.canceled = true;
    trip.seatsAvailable += 1; // Incrementar los asientos disponibles
    await trip.save();

    return res.status(200).json({ message: 'Trip canceled successfully', trip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Cancelar el viaje por parte del conductor
const cancelTripByDriver = async (req, res) => {
  const { tripId } = req.body; // Se espera que el cuerpo contenga tripId
  const userId = req.usuario.id; // ID del conductor a partir del JWT

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (!trip.driver.equals(userId)) {
      return res.status(403).json({ message: 'Not authorized to cancel this trip' });
    }

    trip.canceled = true; // Marcar el viaje como cancelado
    await trip.save();

    return res.status(200).json({ message: 'Trip canceled successfully by driver', trip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const joinTrip = async (req, res) => {
  console.log("hola");
  
  const { tripId } = req.body; // Se espera que el cuerpo contenga tripId
  const userId = req.usuario.id; // ID del usuario a partir del JWT
  console.log(userId)
  try {
    const trip = await Trip.findById(tripId);
    console.log(trip);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verificar si hay asientos disponibles
    if (trip.seatsAvailable <= 0) {
      return res.status(400).json({ message: 'No seats available for this trip' });
    }

    // Verificar si el usuario ya está en la lista de pasajeros
    const passengerStatus = trip.passengersStatus.find(status => status.passengerId.equals(userId));
    if (passengerStatus) {
      return res.status(400).json({ message: 'User is already part of this trip' });
    }

    // Agregar al usuario a la lista de pasajeros
    trip.passengers.push(userId); // Agrega el ID del pasajero
    console.log(trip.passengers);
    
    trip.passengersStatus.push({ // Crea un nuevo estado para el pasajero
      passengerId: userId,
      accepted: false,
      canceled: false
    });

    trip.seatsAvailable -= 1; // Reducir los asientos disponibles

    // Guarda los cambios en el viaje
    await trip.save();

    return res.status(200).json({ message: 'Successfully joined the trip', trip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteUserByAdmin = async (req, res) => {
    const { id } = req.params;
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userToDelete.deleteOne();

    return res.status(200).json({ message: 'User deleted successfully' });
};
const editUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, studentId, email, phone, img, licence, role } = req.body;

    const userToEdit = await User.findById(id);
    if (!userToEdit) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Actualizar los campos que fueron enviados en el cuerpo de la solicitud
    userToEdit.firstName = firstName || userToEdit.firstName;
    userToEdit.lastName = lastName || userToEdit.lastName;
    userToEdit.studentId = studentId || userToEdit.studentId;
    userToEdit.email = email || userToEdit.email;
    userToEdit.phone = phone || userToEdit.phone;
    userToEdit.img = img || userToEdit.img;
    userToEdit.licence = licence || userToEdit.licence;
    userToEdit.role = role || userToEdit.role;

    await userToEdit.save();

    return res.status(200).json({
      message: 'User updated successfully',
      user: userToEdit
    });
};


module.exports = {
  registerUser,
  joinTrip,
  loginUser,
  getUserById,
  radarLocation,
  updateUserLocation,
  getAllUsers,
  deleteUserByAdmin,
  editUserByAdmin,
  updateMyProfile,
  concludeProfile,
  acceptPassenger,
  cancelPassenger,
  cancelTripByDriver,
};
