const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const musicRoutes = require("./routes/music.routes");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cookieParser());

// CORRECTED: Allow both local development and live Vercel requests
const allowedOrigins = [
  "http://localhost:5175",
  "https://music-1jldq5l4d-emaanizhar-7212s-projects.vercel.app" // Your live Vercel app
];

app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true 
}));

// ADDED: A root route to verify the server is live without getting a "Cannot GET /" error
app.get("/", (req, res) => {
  res.send("Music API is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/music", musicRoutes);

module.exports = app;