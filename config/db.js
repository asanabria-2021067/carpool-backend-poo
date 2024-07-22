const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // URI de conexión a MongoDB Atlas
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Detener la aplicación en caso de error
  }
};

module.exports = connectDB;