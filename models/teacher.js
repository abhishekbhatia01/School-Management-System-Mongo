const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    fname: { 
        type: String, 
        required: true 
    },
    lname: { 
        type: String, 
        required: true 
    },
    age: { 
        type: Number, 
        required: true, 
        min: 18, 
        max: 70 
    },
    mobno: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /^[0-9]{10}$/ 
    },
    jdate: { 
        type: Date, 
        required: true 
    },
    qualification: { 
        type: String 
    },
    subject: { 
        type: String 
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;