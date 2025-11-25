// src/pages/Signup.jsx
import React from 'react';
import Login from './Login';

// Reuse the same card layout as Login but start with signup mode
const Signup = () => <Login initialMode="signup" />;

export default Signup;
