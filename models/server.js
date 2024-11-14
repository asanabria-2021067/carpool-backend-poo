const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io'); 
const userRoutes = require('../routes/userRoutes');
const vehicleRoutes = require('../routes/vehicleRoutes');
const tripRoutes = require('../routes/tripRoutes');
const tripHistoryRoutes = require('../routes/tripHistoryRoutes');
const Trip = require('../models/Trip');
const Chat = require('./Chat');
const User = require('./User');

dotenv.config();

class Server {
    constructor() {
        this.app = express();
        this.app.get('/', (req, res) => {
            res.send('Bienvenido al backend de TideDive');
        });
        this.port = process.env.PORT || 3000;

        // Crear servidor HTTP
        this.server = http.createServer(this.app);

        // Configurar Socket.IO con CORS y solo WebSocket como transporte
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: "*", // Usa la URL del frontend en producción
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ["websocket"], // Solo WebSocket para producción
        });

        this.middlewares();
        this.routes();
        this.conectarDB();
        this.sockets(); // Inicializar los sockets
    }

    async conectarDB() {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('MongoDB connected');
        } catch (err) {
            console.error('MongoDB connection error:', err);
            process.exit(1); // Termina la app si no hay conexión
        }
    }

    middlewares() {
        this.app.use(cors());
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

            socket.on('joinTrip', async ({ tripId, userId }) => {
                if (!tripId || !mongoose.Types.ObjectId.isValid(tripId)) {
                    console.error('Error: tripId inválido o nulo');
                    return socket.emit('error', 'tripId inválido');
                }
            
                if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                    console.error('Error: userId inválido o nulo');
                    return socket.emit('error', 'userId inválido');
                }
            
                try {
                    const trip = await Trip.findById(tripId).populate('driver passengers');
                    if (!trip) return socket.emit('error', 'Viaje no encontrado');
            
                    socket.join(tripId);
                    let chat = await Chat.findOne({ tripId });
                    if (!chat) {
                        chat = new Chat({ tripId, participants: [trip.driver, ...trip.passengers] });
                        await chat.save();
                    }
                    socket.emit('joinedTrip', `Te has unido al chat del viaje ${tripId}`);
                } catch (err) {
                    console.error('Error al unirse al viaje:', err);
                    socket.emit('error', 'Error al unirse al viaje');
                }
            });

            socket.on('sendMessage', async ({ tripId, userId, message }) => {
                try {
                    const chat = await Chat.findOne({ tripId });
                    if (!chat) return socket.emit('error', 'Chat no encontrado para este viaje');

                    const user = await User.findById(userId);
                    const senderId = mongoose.Types.ObjectId.isValid(userId) ? mongoose.Types.ObjectId(userId) : userId;
                    const newMessage = { sender: senderId, content: message, timestamp: new Date(), img: user.img };

                    chat.messages.push(newMessage);
                    await chat.save();

                    this.io.to(tripId).emit('receiveMessage', {
                        userId: senderId.toString(),
                        message,
                        timestamp: new Date(),
                        img: user.img,
                    });
                } catch (err) {
                    console.error('Error al enviar el mensaje:', err);
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
