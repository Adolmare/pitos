const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // 1 to 30
  name: { type: String, required: true }, 
  status: { 
    type: String, 
    enum: ['free', 'occupied', 'attention'], 
    default: 'free' 
  },
  items: [{
      id: Number, // product id
      name: String,
      price: Number,
      quantity: Number
  }],
  total: { type: Number, default: 0 },
  startTime: { type: Date },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null }
});

module.exports = mongoose.model('Table', tableSchema);
