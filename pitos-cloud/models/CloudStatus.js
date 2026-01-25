const mongoose = require('mongoose');

const cloudStatusSchema = new mongoose.Schema({
    isOpen: Boolean
});

module.exports = mongoose.model('CloudStatus', cloudStatusSchema);
