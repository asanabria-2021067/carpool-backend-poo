require('dotenv').config();

const Server = require('./models/server');

const servidorIniciado = new Server();

servidorIniciado.listen();