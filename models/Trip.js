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
  startTime: { type: Date },
  seatsAvailable: { type: Number, required: true },
  passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  price: { type: Number, default: 0 },
  passengersStatus: [{
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accepted: { type: Boolean, default: false },
    canceled: { type: Boolean, default: false }
  }],
  securityCode: { type: Number, default: () => Math.floor(1000 + Math.random() * 9000) },
  createdAt: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false}
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
