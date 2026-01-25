const mongoose = require('mongoose');

const cloudOrderSchema = new mongoose.Schema({
    id: String, // "WEB-..." or "NUBE-..." or "TBL-..."
    source: { type: String, enum: ['WEB', 'LOCAL'], default: 'WEB' },
    status: String, // pending-download, downloaded, assigned, completed
    customer: Object,
    items: Array,
    total: Number,
    assignedTo: Number, // Local User ID (driver)
    deliveredAt: Date,
    syncedBack: { type: Boolean, default: false }, // For delivered orders syncing back to local
    createdAt: { type: Date, default: Date.now }
}, { strict: false });

module.exports = mongoose.model('CloudOrder', cloudOrderSchema);
