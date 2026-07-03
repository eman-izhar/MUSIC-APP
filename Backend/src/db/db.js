const mongoose = require("mongoose");
require ("dotenv").config()

async function connectDB() {
  try {
    mongoose.connect(process.env.MONGO_URI);
    console.log("DB conntected successfully");
  } catch (err) {
    console.error("error connected to DB", err);
  }
}

module.exports = connectDB;
