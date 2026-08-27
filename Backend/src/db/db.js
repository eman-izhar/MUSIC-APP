const mongoose = require("mongoose");
require ("dotenv").config()

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected successfully");
  } catch (err) {
    console.error("Error connecting to DB", err);
  }
}

module.exports = connectDB;
