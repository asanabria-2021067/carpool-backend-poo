const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');  // Para crear el servidor HTTP
const { Server: SocketIOServer } = require('socket.io'); // Importamos el servidor de Socket.IO
const userRoutes = require('../routes/userRoutes');
const vehicleRoutes = require('../routes/vehicleRoutes');
const tripRoutes = require('../routes/tripRoutes');
const tripHistoryRoutes = require('../routes/tripHistoryRoutes');
const Trip = require('../models/Trip');  // Asegúrate de tener el modelo Trip cargado

class Server {

    constructor() {
        this.app = express();
        this.app.get('/', (req, res) => {
            res.send('Bienvenido al backend de TideDive');
        });
        this.port = process.env.PORT || 3000;

        // Crear servidor HTTP a partir de Express
        this.server = http.createServer(this.app);

        // Crear instancia de Socket.IO
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.middlewares();
        this.routes();
        this.conectarDB();
        this.sockets();  // Inicializar los sockets
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
        this.app.use(express.static('public'));
    }

    routes() {
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/vehicles', vehicleRoutes);
        this.app.use('/api/trips', tripRoutes);
        this.app.use('/api/trip-history', tripHistoryRoutes);
    }

    sockets() {
        this.io.on('connection', (socket) => {
            console.log('Usuario conectado:', socket.id);

            // Unirse a una sala de viaje
            socket.on('joinTrip', async ({ tripId, userId }) => {
                try {
                    const trip = await Trip.findById(tripId).populate('driver passengers');
                    if (!trip) return socket.emit('error', 'Viaje no encontrado');

                    const isParticipant = trip.passengers.some(p => p.equals(userId)) || trip.driver.equals(userId);

                    if (isParticipant) {
                        socket.join(tripId);  // Unirse a la sala del viaje

                        // Verificar si ya existe un chat para este viaje
                        let chat = await Chat.findOne({ tripId });
                        if (!chat) {
                            // Si no existe un chat, crearlo
                            chat = new Chat({
                                tripId,
                                participants: [trip.driver, ...trip.passengers]
                            });
                            await chat.save();
                        }

                        socket.emit('joinedTrip', `Te has unido al chat del viaje ${tripId}`);
                    } else {
                        socket.emit('error', 'No estás autorizado para unirte a este chat');
                    }
                } catch (err) {
                    console.error(err);
                    socket.emit('error', 'Error al unirse al viaje');
                }
            });

            // Enviar mensajes a la sala y guardarlos en la base de datos
            socket.on('sendMessage', async ({ tripId, userId, message }) => {
                try {
                    const chat = await Chat.findOne({ tripId });

                    if (!chat) {
                        return socket.emit('error', 'Chat no encontrado para este viaje');
                    }

                    // Crear un nuevo mensaje
                    const newMessage = {
                        sender: userId,
                        content: message,
                        timestamp: new Date()
                    };

                    // Agregar el mensaje al chat y guardar en la base de datos
                    chat.messages.push(newMessage);
                    await chat.save();

                    // Enviar el mensaje a todos los participantes de la sala del viaje
                    this.io.to(tripId).emit('receiveMessage', { userId, message, timestamp: new Date() });
                } catch (err) {
                    console.error(err);
                    socket.emit('error', 'Error al enviar el mensaje');
                }
            });

            socket.on('disconnect', () => {
                console.log('Usuario desconectado:', socket.id);
            });
        });
    }
    

    listen() {
        this.server.listen(this.port, () => {
            console.log(`Servidor corriendo en el puerto ${this.port}`);
        });
    }
}

module.exports = Server;
