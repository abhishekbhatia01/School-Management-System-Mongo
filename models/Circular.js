const mongoose = require('mongoose');

const circularSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    issuedBy: {
        type: String,
        required: true
    },
    issuedDate: {
        type: Date,
        default: Date.now
    },
    targetAudience: {
        type: String,
        enum: ['All', 'Students', 'Teachers', 'Parents', 'Staff'],
        default: 'All'
    }
});

const Circular = mongoose.model('Circular', circularSchema);
module.exports = Circular;