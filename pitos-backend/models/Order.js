const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, required: true, min: 1 },
  name: { type: String }, 
  price: { type: Number, required: true },
  id: { type: Number } // For backward compatibility with array based IDs
});

const orderSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // Store "NUBE-123" or timestamp
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  type: { 
    type: String, 
    enum: ['dine-in', 'takeout', 'delivery'], 
    default: 'dine-in' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'cooking', 'ready', 'served', 'completed', 'cancelled', 'delivered'], 
    default: 'pending' 
  },
  items: [orderItemSchema],
  total: { type: Number, default: 0 },
  
  customer: {
    name: String,
    address: String,
    phone: String,
    location: mongoose.Schema.Types.Mixed,
    paymentMethod: String,
    notes: String
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isWebOrder: { type: Boolean, default: false },

  receivedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware para actualizar updatedAt
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
