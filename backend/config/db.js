const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI missing in .env");
    }

    await mongoose.connect(mongoURI, {
      dbName: "studentsiat",
    });

    console.log("MongoDB Atlas connected");
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
