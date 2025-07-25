import mongoose from 'mongoose'

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Office Supplies', 'Furniture', 'Technology', 'Promotional Materials', 'Consumables', 'Other'],
    default: 'Other'
  },
  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative']
  },
  image: {
    type: String,
    default: '/images/default-resource.jpg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// Method to check if enough quantity is available
ResourceSchema.methods.hasAvailableQuantity = function(requestedQuantity) {
  return this.availableQuantity >= requestedQuantity;
};

export default mongoose.models.Resource || mongoose.model('Resource', ResourceSchema) 