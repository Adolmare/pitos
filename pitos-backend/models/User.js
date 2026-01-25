const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Almacenar hash, no texto plano
  role: { 
    type: String, 
    enum: ['admin', 'cocina', 'repartidor', 'mesero'], 
    default: 'mesero' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
