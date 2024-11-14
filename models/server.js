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
const { log } = require('console');

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
              origin: "*",
              methods: ["GET", "POST"],
            },
          });
        
        

        this.middlewares();
        this.routes();
        this.conectarDB();
        this.sockets(); // Inicializar los sockets
    }

    async conectarDB() {
        try {
            await mongoose.connect(process.env.MONGO_URI);
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
                console.log("Intentando unirse al viaje");
                try {
                    const trip = await Trip.findById(tripId).populate('driver passengers');
                    console.log("Datos del viaje:", trip);
                    if (!trip) return socket.emit('error', 'Viaje no encontrado');
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
                            console.log("Chat creado:", chat);
                        }
                        socket.emit('joinedTrip', {
                            message: `Te has unido al chat del viaje ${tripId}`,
                            messages: chat.messages,
                        });
                } catch (err) {
                    console.error(err);
                    socket.emit('error', 'Error al unirse al viaje');
                }
            });
            socket.on('sendMessage', async ({ tripId, userId, message }) => {
                try {
                    const chat = await Chat.findOne({ tripId });
                    if (!chat) {
                        return socket.emit('error', 'Chat no encontrado para este viaje');
                    }
                    console.log(userId);
                    const user = await User.findById(userId);
                    console.log(user);
                    
                    // Convertir el userId a ObjectId solo si es un formato válido
                    const senderId = mongoose.Types.ObjectId.isValid(userId)
                        ? new mongoose.Types.ObjectId(userId)
                        : userId;
                    // Crear el nuevo mensaje con el senderId y message
                    const newMessage = {
                        sender: senderId,
                        content: message,
                        timestamp: new Date(),
                        img: user.img, 
                    };
                    // Agregar el mensaje al chat y guardar en la base de datos
                    chat.messages.push(newMessage);
                    await chat.save();
                    // Emitir el mensaje recibido a todos en la sala del viaje
                    this.io.to(tripId).emit('receiveMessage', {
                        userId: senderId.toString(),
                        message,
                        timestamp: new Date(),
                        img: user.img,  // Imagen del usuario que envió el mensaje
                    });
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
