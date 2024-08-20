const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  model: {type: String, required: true},
  capacity: { type: Number, required: true },
  plateNumber: { type: String, required: true },
  carImage: { type: String }, // Path a la imagen del carro
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
