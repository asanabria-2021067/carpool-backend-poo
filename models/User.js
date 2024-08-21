const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: false },
  role: { type: String, required: false, enum: ["Usuario", "Administrador", "Conductor"] },
  lastName: { type: String, required: false },
  studentId: { type: String, required: false },
  email: { type: String, required: false, unique: true },
  password: { type: String, required: false },
  phone: { type: String , default: ""},
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: false,
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
