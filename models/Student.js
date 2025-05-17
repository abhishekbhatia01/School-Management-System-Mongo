const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    // Basic student information
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    
    // Contact information
    fathername: { type: String, required: true },
    mobno: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },
    
    // Academic information
    rollNumber: { type: String, sparse: true },
    batch: { type: String, required: true },
    
    // Reference to class
    classId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        required: true 
    },
    
    // Reference to user account (optional, for login)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;