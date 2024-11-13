const Trip = require('../models/Trip');
const twilio = require('twilio');
const TripHistory = require('../models/TripHistory');
const accountSid = 'ACcc74276611053278107666e139d13ccc'; // Tu Account SID de Twilio
const authToken = '1fb2942a8efe76b1397fb2209b290c47';   // Tu Auth Token de Twilio
const client = new twilio(accountSid, authToken);
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

// Crear un viaje
const createTrip = async (req, res) => {
  const id = req.usuario.id;
  const driver = await User.findById(id);
  const vehicle = await Vehicle.findOne({ owner: id });

  if (!vehicle) {
    return res.status(400).json({ message: 'Vehicle not exists' });
  }

  if (!driver) {
    return res.status(400).json({ message: 'Invalid driver' });
  }

  if (driver.role !== "Conductor") {
    return res.status(400).json({ message: 'The user must have the driver role' });
  }

  // Verificar si el conductor tiene un viaje activo
  const activeTrip = await Trip.findOne({ driver: id, completed: false });
  if (activeTrip) {
    return res.status(400).json({ message: 'You must complete your current trip before creating a new one' });
  }

  // Verificar si el conductor tiene una ubicación definida
  if (!driver.location || !driver.location.coordinates || driver.location.coordinates.length !== 2) {
    console.error('Error: El conductor no tiene una ubicación válida:', driver.location);
    return res.status(400).json({ message: 'Driver must have a valid location' });
  }

  console.log('Ubicación del conductor:', driver.location);  // Agregar para depuración


  const { startLocation, endLocation, seatsAvailable, passengers, price } = req.body;
  const startTime = Date.now();

  try {
    const trip = await Trip.create({
      driver,
      vehicle,
      startLocation,
      endLocation,
      startTime,
      seatsAvailable,
      passengers,
      price
    });

    // Agregar el viaje al historial del conductor
    await TripHistory.create({
      user: driver,
      trip: trip._id,
      role: 'driver',
    });

    // Agregar el viaje al historial de cada pasajero
    for (const passenger of passengers) {
      await TripHistory.create({
        user: passenger,
        trip: trip._id,
        role: 'passenger',
      });
    }

    res.status(201).json(trip);
  } catch (error) {
    console.error('Error al crear el viaje:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getAllTrips = async (req, res) => {
  try {
    const trip = await Trip.find({completed: false})
      .populate('driver', 'firstName lastName email')
      .populate({
        path: 'vehicle',
        populate: {
          path: 'owner',
          select: 'firstName lastName email',
        },
      })
      .populate('passengers', 'firstName lastName email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Obtener un viaje por ID
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('driver', 'firstName lastName email')
      .populate({
        path: 'vehicle',
        populate: {
          path: 'owner',
          select: 'firstName lastName email',
        },
      })
      .populate('passengers', 'firstName lastName email img');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Unirse a un viaje
const joinTrip = async (req, res) => {
  const { tripId } = req.body;
  const userId = req.usuario.id;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.seatsAvailable <= 0) {
      return res.status(400).json({ message: 'No seats available' });
    }

    // Verificar si el usuario ya tiene un viaje activo
    const activePassengerTrip = await Trip.findOne({ passengers: userId, completed: false });
    if (activePassengerTrip) {
      return res.status(400).json({ message: 'You cannot join more than one active trip' });
    }

    // Verificar que el usuario no esté ya en la lista de pasajeros
    if (trip.passengers.includes(userId)) {
      return res.status(400).json({ message: 'User already joined the trip' });
    }

    // Validar que seatsAvailable tiene un valor válido
    if (!trip.seatsAvailable || isNaN(trip.seatsAvailable)) {
      return res.status(400).json({ message: 'Invalid seats available' });
    }

    // Agregar el usuario a los pasajeros
    trip.passengers.push(userId);
    trip.seatsAvailable -= 1;
    await trip.save();

    // Agregar el viaje al historial del usuario
    await TripHistory.create({
      user: userId,
      trip: trip._id,
      role: 'passenger',
    });

    res.json(trip);

};
const generateWazeLink = (lat, lng) => {
  return `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;
};

const sendSecurityCode = async (req, res) => {
  const id = req.usuario.id;
  const now = new Date();
    const Usuario = await User.findById(id);
    if (!Usuario) {
      return res.status(404).json({ message: 'User not found' });
    }

    const trip = await Trip.findOne({ driver: id, startTime: { $gte: now } })
      .populate('passengers')
      .sort({ startTime: 1 })  // Ordenar por fecha ascendente
      .exec();

    if (!trip) {
      return res.status(404).json({ message: 'No upcoming trips found' });
    }

    const securityCode = trip.securityCode;
    console.log("hola", securityCode);
    const passengerPromises = trip.passengers.map(passenger =>
      client.messages.create({
        body: `Your security code is: ${securityCode}`,
        from: '+1234567890', // Tu número de Twilio
        to: passenger.phoneNumber // Asegúrate de que el modelo de User tenga el campo phoneNumber
      })
    );

    await Promise.all(passengerPromises);
    res.status(200).json({ securityCode });
};


// auth security code
const comprobatedSecurityCode = async (req, res) => {
  const id = req.usuario.id;
  const { securityCode } = req.body;

  try {
    // Buscar al usuario por su ID
    const Usuario = await User.findById(id);
    if (!Usuario) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Obtener la fecha actual
    const now = new Date();

    // Buscar el viaje más cercano al actual para el conductor
    const trip = await Trip.findOne({ driver: id, date: { $gte: now } })
      .sort({ date: 1 })  // Ordenar por fecha ascendente
      .exec();

    if (trip) {
      // Comparar el código de seguridad proporcionado con el del viaje
      if (trip.securityCode === securityCode) {
        trip.accepted = true;
        trip.save();
        return res.status(200).json({
          trip,
          message: 'Security code is valid and closest trip found'
        });
      } else {
        return res.status(400).json({ message: 'Invalid security code' });
      }
    } else {
      return res.status(404).json({ message: 'No upcoming trips found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

const completeTrip = async (req, res) => {
  const { tripId } = req.body;

  try {
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Marcar el viaje como completado
    trip.completed = true;
    await trip.save();

    res.status(200).json({ message: 'Trip completed successfully', trip });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


module.exports = {
  createTrip,
  getTripById,
  joinTrip,
  getAllTrips,
  comprobatedSecurityCode,
  sendSecurityCode,
  completeTrip
};
