const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('../routes/userRoutes');
const vehicleRoutes = require('../routes/vehicleRoutes');
const tripRoutes = require('../routes/tripRoutes');
const tripHistoryRoutes = require('../routes/tripHistoryRoutes');

class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.app.get('/', (req, res) => {
            res.send("Bienvenido al backend de TideDive!!")
        })
        this.middlewares();
        this.routes();

        this.middlewares();
        this.routes();
        this.conectarDB();
    }

    async conectarDB() {
        await mongoose.connect(process.env.MONGO_URI, {
        })
            .then(() => console.log('MongoDB connected'))
            .catch(err => console.error('MongoDB connection error:', err));
    }

    middlewares() {
        // Middleware para parsear JSON
        this.app.use(express.json());
        this.app.use(cors());
        this.app.use(express.static('public'));
    }



    routes() {
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/vehicles', vehicleRoutes);
        this.app.use('/api/trips', tripRoutes);
        this.app.use('/api/trip-history', tripHistoryRoutes);
    }

    listen() {
        this.app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
    }
}

module.exports = Server;