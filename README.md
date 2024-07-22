# Carpool UVG - Backend
## Descripción
Carpool UVG es una aplicación desarrollada en MERN (MongoDB, Express, React, Node.js) enfocada en reducir el tráfico en las entradas de la Universidad del Valle de Guatemala (UVG) y facilitar el viaje de los estudiantes desde sus hogares a la universidad y de regreso. Esta aplicación permite a los estudiantes coordinar viajes compartidos, promoviendo así una opción de transporte más eficiente y sostenible. Este repositorio contiene el backend de la aplicación, construido con Node.js y Express, y utilizando MongoDB como base de datos.
## Requisitos
- Node.js v14 o superior
- npm v6 o superior
- MongoDB
## Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/carpool-uvg-backend.git
   cd carpool-uvg-backend
2. Instala las dependencias
   ```bash
   npm install
3. Configura las variables de entorno. Crea un archivo .env en la raíz del proyecto con el siguiente contenido:
   ```bash
   MONGODB_URI=tu_uri_de_mongodb
   PORT=puerto_de_tu_servidor
   JWT_SECRET=tu_token_secreto
4. Para ejecutar el proyecto utiliza:
   ```bash
   npm run dev
