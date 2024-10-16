const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Quien envió el mensaje
  content: { type: String, required: true },  // Contenido del mensaje
  timestamp: { type: Date, default: Date.now }  // Fecha y hora del mensaje
});

const chatSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },  // Referencia al viaje
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // Participantes (conductor y pasajeros)
  messages: [messageSchema],  // Array de mensajes
  createdAt: { type: Date, default: Date.now }  // Fecha de creación del chat
});

// Crear el modelo 'Chat' en base al esquema
const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
