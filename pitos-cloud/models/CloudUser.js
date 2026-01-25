const mongoose = require('mongoose');

const cloudUserSchema = new mongoose.Schema({
    username: String,
    passwordHash: String, // Validated against hash synced from local
    role: String,
    id: Number // Local ID
});

module.exports = mongoose.model('CloudUser', cloudUserSchema);
