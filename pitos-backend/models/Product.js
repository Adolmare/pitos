const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Legacy numeric ID
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String }, // URL de la imagen
  category: { 
    type: String, 
    required: true 
    // Ej: 'pizzas', 'bebidas', 'rapidas', 'helados'
  },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
