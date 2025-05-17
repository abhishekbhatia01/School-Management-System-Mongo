const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    classId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;