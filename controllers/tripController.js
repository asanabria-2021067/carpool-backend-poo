const Trip = require('../models/Trip');
const TripHistory = require('../models/TripHistory');

// Crear un viaje
const createTrip = async (req, res) => {
  const { driver, vehicle, startLocation, endLocation, startTime, seatsAvailable, passengers } = req.body;

  try {
    const trip = await Trip.create({
      driver,
      vehicle,
      startLocation,
      endLocation,
      startTime,
      seatsAvailable,
      passengers,
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
    res.status(500).json({ message: 'Server error' });
  }
};


const getAllTrips = async (req, res) => {
  try {
    const trip = await Trip.find()
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
      .populate('passengers', 'firstName lastName email');

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
  const { tripId, userId } = req.body;

  try {
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.seatsAvailable <= 0) {
      return res.status(400).json({ message: 'No seats available' });
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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const generateWazeLink = (lat, lng) => {
  return `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;
};


module.exports = {
  createTrip,
  getTripById,
  joinTrip,
  getAllTrips
};
