const TripHistory = require('../models/TripHistory');

// Obtener el historial de viajes de un usuario pasajero
const getUserTripHistory = async (req, res) => {
  const id = req.usuario.id;
  try {
    const tripHistory = await TripHistory.find({ user: id })
      .populate('trip')
      .populate('trip.driver', 'firstName lastName email img')
      .populate('trip.vehicle')
      .populate('trip.passengers', 'firstName lastName email img');
    if (!tripHistory) {
      return res.status(404).json({ message: 'Trip history not found' });
    }
    res.json(tripHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserTripHistory,
};
