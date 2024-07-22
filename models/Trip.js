const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  startLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  endLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  startTime: { type: Date, required: true },
  seatsAvailable: { type: Number, required: true },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  price: { type: Number, default: 0 }
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
