// // Authentication Routes
// const express = require('express');
// const authController = require('../controllers/authController');

// const router = express.Router();

// // PUBLIC ROUTES — should NOT use authMiddleware
// router.post('/signup', authController.signup);
// router.post('/login', authController.login);

// module.exports = router;

// Authentication routes
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', authController.signup);

// POST /api/auth/login
router.post('/login', authController.login);

// PUT /api/auth/profile
router.put('/profile', authController.updateProfile);

// PUT /api/auth/subjects
router.put('/subjects', authController.updateSubjects);

module.exports = router;
