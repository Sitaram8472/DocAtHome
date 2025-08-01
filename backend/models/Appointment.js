const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  doctor: { // This field stores the ID of the professional (doctor or nurse)
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  patient: { // This field stores the ID of the patient booking the appointment
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  appointmentDate: {
    type: String, // e.g., "2025-07-02"
    required: true,
  },
  appointmentTime: {
    type: String, // e.g., "01:00 PM"
    required: true,
  },
  bookingType: {
    type: String,
    enum: ['In-Home Visit', 'Video Consultation', 'Nurse Assignment'],
    required: true,
  },
  symptoms: {
    type: String,
    required: [true, 'Please describe your symptoms or needs.'], // This field is required
  },
  previousMeds: {
    type: String, // This field is now optional
  },
  reportImage: {
    type: String, // This field is now optional
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  fee: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);