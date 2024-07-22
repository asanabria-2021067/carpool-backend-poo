const Vehicle = require('../models/Vehicle');

// Crear vehículo
const createVehicle = async (req, res) => {
  const { owner, type, capacity, plateNumber } = req.body;

  try {
    const vehicle = await Vehicle.create({
      owner,
      type,
      capacity,
      plateNumber,
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllVehicles = async (req, res) => {
  try {
    const vehicle = await Vehicle.find().populate('owner', 'firstName lastName email');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Obtener vehículo por ID
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'firstName lastName email');
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

  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    vehicle.type = type || vehicle.type;
    vehicle.capacity = capacity || vehicle.capacity;
    vehicle.plateNumber = plateNumber || vehicle.plateNumber;

    await vehicle.save();

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Eliminar vehículo
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

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
};
