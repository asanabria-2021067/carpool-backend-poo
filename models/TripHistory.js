const mongoose = require('mongoose');

const tripHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  role: { type: String, enum: ['driver', 'passenger'], required: true },
});

module.exports = mongoose.model('TripHistory', tripHistorySchema);
