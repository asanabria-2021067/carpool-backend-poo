const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

// Crear vehículo
const createVehicle = async (req, res) => {
  const id = req.usuario.id;
  const owner = User.findById(id);
  if (!owner) {
    return res.status(400).json({ message: 'User not found' });
  }
  const { type, capacity, plateNumber, model, carImage  } = req.body;
    const vehicle = await Vehicle.create({
      owner: id,
      type: type,
      capacity: capacity,
      plateNumber: plateNumber,
      model: model,
      carImage: carImage,
    });

    res.status(201).json(vehicle);
};

const getAllVehicles = async (req, res) => {
    const vehicle = await Vehicle.find().populate('owner', 'firstName lastName email');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
};


// Obtener vehículo por ID
const getVehicleById = async (req, res) => {
  const id = req.usuario.id;
  const owner = User.findById(id);
  try {
    const vehicle = await Vehicle.find({owner: id}).populate('owner', 'firstName lastName email');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Actualizar vehículo
const updateVehicle = async (req, res) => {
  const { type, capacity, plateNumber } = req.body;
  const id = req.usuario.id;
  const owner = User.findById(id);
  try {
    if(owner){
    const vehicle = await Vehicle.findOne({owner: id});

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    vehicle.type = type || vehicle.type;
    vehicle.capacity = capacity || vehicle.capacity;
    vehicle.plateNumber = plateNumber || vehicle.plateNumber;
    vehicle.carImage = carImage || vehicle.carImage;

    await vehicle.save();

    res.json(vehicle);
  }else{
    return res.status(403).json({ message: 'Vehicle not found' });
  }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Eliminar vehículo
const deleteVehicle = async (req, res) => {
  const id = req.usuario.id;
  try {
    const vehicle = await Vehicle.findOne({owner: id});

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.remove();

    res.json({ message: 'Vehicle removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createVehicle,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getAllVehicles,
};
