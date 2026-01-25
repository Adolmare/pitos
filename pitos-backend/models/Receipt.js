const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  text: { type: String },
  imageUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
  uploadedBy: { type: String }, // Username text for now, or Ref to User
});

module.exports = mongoose.model('Receipt', receiptSchema);
