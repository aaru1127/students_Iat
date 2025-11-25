// Backend server entry point
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();

// CORS: allow React dev server
app.use(
  cors()
);
app.options('*', cors());

// JSON body parser
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const marksRoutes = require('./routes/marksRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/marks', marksRoutes);

// Start server after DB connection
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;
