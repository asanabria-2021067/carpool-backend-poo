const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const tripRoutes = require('./routes/tripRoutes');
const tripHistoryRoutes = require('./routes/tripHistoryRoutes');
// Configurar dotenv para usar variables de entorno
dotenv.config();

// Crear una instancia de Express
const app = express();

// Middleware para parsear JSON
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Usar rutas
app.get('/', (req = express.request, res = express.response) => {
  res.send("PAGINA DE INICIO")
})
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/trip-history', tripHistoryRoutes);

// Configurar puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
