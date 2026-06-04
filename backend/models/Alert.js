const mongoose = require('mongoose');

const alertSchema = mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
