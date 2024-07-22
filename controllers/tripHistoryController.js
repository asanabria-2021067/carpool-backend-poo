const TripHistory = require('../models/TripHistory');

// Obtener el historial de viajes de un usuario
const getUserTripHistory = async (req, res) => {
  try {
    const tripHistory = await TripHistory.find({ user: req.params.userId })
      .populate('trip')
      .populate('trip.driver', 'firstName lastName email')
      .populate('trip.vehicle')
      .populate('trip.passengers', 'firstName lastName email');
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
