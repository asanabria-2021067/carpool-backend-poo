const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  role: { type: String, required: true, enum: ["Usuario", "Administrador", "Conductor"] },
  lastName: { type: String, required: true },
  studentId: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0],
      validate: {
        validator: function (value) {
          return value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number';
        },
        message: 'Coordinates must be an array of two numbers'
      }
    }
  },
  img: { type: String, required: false },
  licence: { type: String, required: false, default: "" },
});

// Crear un índice geoespacial en el campo `location`
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

module.exports = User;
