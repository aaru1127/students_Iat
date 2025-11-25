// src/components/AuthIllustration.jsx
import React from "react";
import illustration from "../assets/logo.svg"; // Use your own SVG if available

const AuthIllustration = () => (
  <div className="auth-illustration">
    <img src={illustration} alt="Students illustration" className="illustration-img" />
  </div>
);

export default AuthIllustration;
