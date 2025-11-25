// // Authentication Controller
// const User = require('../models/userModel');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const authController = {
//   signup: async (req, res) => {
//     try {
//       const { email, password, name, role, department, class: className, section } = req.body;
      
//       // Check if user exists
//       const existingUser = await User.findOne({ email });
//       if (existingUser) {
//         return res.status(400).json({ message: 'User already exists' });
//       }

//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 10);

//       // Create new user
//       const user = new User({
//         email,
//         password: hashedPassword,
//         name,
//         role: role || 'student',
//         department,
//         class: className,
//         section,
//       });

//       await user.save();

//       // Generate token
//       const token = jwt.sign(
//         { userId: user._id, role: user.role },
//         process.env.JWT_SECRET || 'your-secret-key',
//         { expiresIn: '7d' }
//       );

//       res.status(201).json({
//         message: 'User registered successfully',
//         token,
//         user: {
//           id: user._id,
//           email: user.email,
//           name: user.name,
//           role: user.role,
//           department: user.department,
//           class: user.class,
//           section: user.section,
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: 'Registration error', error: error.message });
//     }
//   },

//   login: async (req, res) => {
//     try {
//       const { email, password } = req.body;

//       // Find user
//       const user = await User.findOne({ email });
//       if (!user) {
//         return res.status(404).json({ message: 'Email not found' });
//       }

//       // Check password
//       const isPasswordValid = await bcrypt.compare(password, user.password);
//       if (!isPasswordValid) {
//         return res.status(401).json({ message: 'Incorrect password' });
//       }

//       // Generate token
//       const token = jwt.sign(
//         { userId: user._id, role: user.role },
//         process.env.JWT_SECRET || 'your-secret-key',
//         { expiresIn: '7d' }
//       );

//       res.json({
//         message: 'Login successful',
//         token,
//         user: {
//           id: user._id,
//           email: user.email,
//           name: user.name,
//           role: user.role,
//           department: user.department,
//           class: user.class,
//           section: user.section,
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: 'Login error', error: error.message });
//     }
//   }
// };

// module.exports = authController;


// Authentication Controller (signup + login)
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  class: user.class,
  section: user.section,
  usn: user.usn,
  year: user.year,
  subjects: user.subjects || [],
  profileCompleted: !!user.profileCompleted,
});

const signToken = (user) => {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(
    { userId: user._id, role: user.role },
    secret,
    { expiresIn: '7d' }
  );
};

const authController = {
  // POST /api/auth/signup
  signup: async (req, res) => {
    try {
      const { name, email, password, role, department, class: className, section } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashed,
        role: role || 'student',
        department: department || '',
        class: className || '',
        section: section || '',
      });

      const token = signToken(user);

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: buildUserPayload(user),
      });
    } catch (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ message: 'Registration error', error: err.message });
    }
  },

  // POST /api/auth/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.status(401).json({ message: 'Incorrect password' });
      }

      const token = signToken(user);

      return res.json({
        message: 'Login successful',
        token,
        user: buildUserPayload(user),
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Login error', error: err.message });
    }
  },

  // PUT /api/auth/profile
  updateProfile: async (req, res) => {
    try {
      const { userId, usn, department, section, year, profileCompleted } = req.body;
      if (!userId) return res.status(400).json({ message: 'userId is required' });

      const user = await User.findByIdAndUpdate(
        userId,
        {
          ...(usn !== undefined ? { usn } : {}),
          ...(department !== undefined ? { department } : {}),
          ...(section !== undefined ? { section } : {}),
          ...(year !== undefined ? { year } : {}),
          ...(profileCompleted !== undefined ? { profileCompleted } : {}),
        },
        { new: true }
      );

      if (!user) return res.status(404).json({ message: 'User not found' });

      const token = signToken(user);
      return res.json({ message: 'Profile updated', token, user: buildUserPayload(user) });
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({ message: 'Failed to update profile', error: err.message });
    }
  },

  // PUT /api/auth/subjects
  updateSubjects: async (req, res) => {
    try {
      const { userId, subjects = [], year, department } = req.body;
      if (!userId) return res.status(400).json({ message: 'userId is required' });

      const user = await User.findByIdAndUpdate(
        userId,
        {
          subjects,
          ...(year !== undefined ? { year } : {}),
          ...(department !== undefined ? { department } : {}),
          profileCompleted: true,
        },
        { new: true }
      );

      if (!user) return res.status(404).json({ message: 'User not found' });

      const token = signToken(user);
      return res.json({ message: 'Subjects updated', token, user: buildUserPayload(user) });
    } catch (err) {
      console.error('Update subjects error:', err);
      return res.status(500).json({ message: 'Failed to update subjects', error: err.message });
    }
  },
};

module.exports = authController;
