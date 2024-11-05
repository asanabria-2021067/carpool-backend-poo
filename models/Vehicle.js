const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: false },
  model: {type: String, required: false},
  capacity: { type: Number, required: false },
  plateNumber: { type: String, required: false },
  carImage: { type: String, required: false }, // Path a la imagen del carro
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
