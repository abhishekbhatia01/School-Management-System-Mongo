const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;