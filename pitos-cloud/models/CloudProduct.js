const mongoose = require('mongoose');

const cloudProductSchema = new mongoose.Schema({
    id: Number, // Sync ID from local
    name: String,
    description: String,
    price: Number,
    image: String,
    category: String,
    isAvailable: Boolean
}, { strict: false });

module.exports = mongoose.model('CloudProduct', cloudProductSchema);
