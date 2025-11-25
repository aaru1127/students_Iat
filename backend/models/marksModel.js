// Marks Model
const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  category: {
    type: String,
    enum: ['IAT', 'Lab', 'Assignment'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed'
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

module.exports = mongoose.model('Marks', marksSchema);
