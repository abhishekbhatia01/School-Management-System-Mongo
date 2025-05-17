const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true },

  name: { 
    type: String, 
    required: true },

  email: { 
    type: String, 
    required: true, 
    unique: true },

  password: { 
    type: String, 
    required: true },

  role: { 
    type: String, 
    enum: ['admin', 'teacher', 'student'], 
    required: true },

  profile: {
    phone: String,
    address: String,
    bio: String,
    avatar: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    }
  },

  passwordChanged: { 
    type: Boolean, 
    default: false 
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
