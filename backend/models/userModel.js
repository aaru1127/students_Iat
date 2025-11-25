// User model definition
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      default: 'student',
    },
    // University Seat Number (optional, for students)
    usn: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    class: {
      type: String,
      default: '',
      trim: true,
    },
    section: {
      type: String,
      default: '',
      trim: true,
    },
    year: {
      type: String,
      default: '',
      trim: true,
    },
    subjects: {
      type: [String],
      default: [],
    },
    profileCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
