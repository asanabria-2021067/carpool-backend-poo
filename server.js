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
this.app.use(express.json());
this.app.use(cors());
this.app.use(express.static('public'));

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Usar rutas
this.app.get('/', (req = express.request, res = express.response) => {
  res.send("PAGINA DE INICIO")
})
this.app.use('/api/users', userRoutes);
this.app.use('/api/vehicles', vehicleRoutes);
this.app.use('/api/trips', tripRoutes);
this.app.use('/api/trip-history', tripHistoryRoutes);

// Configurar puerto
const PORT = process.env.PORT || 3000;
this.app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
