import mongoose from 'mongoose'

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  location: {
    type: String,
    required: [true, 'Room location is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  facilities: [{
    type: String,
    enum: ['Videoproiector', 'Tabla Alba', 'Calculator', 'Sistem Audio', 'Aer Conditionat', 'Tabla Digitala', 'Altele']
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: '/images/default-room.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

export default mongoose.models.Room || mongoose.model('Room', RoomSchema) 