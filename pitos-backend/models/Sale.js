const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  totalAmount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'], 
    default: 'Efectivo' 
  },
  date: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Quién cerró la venta
});

module.exports = mongoose.model('Sale', saleSchema);
