const User = require('../models/User');

// @desc    Get all verified doctors, with optional filters
const getDoctors = async (req, res) => {
  try {
    const query = { role: 'doctor', isVerified: true };

    if (req.query.specialty && req.query.specialty !== '') {
      query.specialty = { $regex: req.query.specialty, $options: 'i' };
    }
    if (req.query.city && req.query.city !== '') {
      query.city = { $regex: req.query.city, $options: 'i' };
    }

    const doctors = await User.find(query).select('-password');
    res.json(doctors);

  } catch (error) {
    console.error('ERROR in getDoctors:', error.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get a single doctor by ID
const getDoctorById = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).select('-password');

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ msg: 'Doctor not found' });
    }

    res.json(doctor);

  } catch (error) {
    console.error('ERROR in getDoctorById:', error.message);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Doctor not found' });
    }
    res.status(500).send('Server Error');
  }
};

// This is the most standard way to export multiple functions
module.exports = {
    getDoctors,
    getDoctorById
};