const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const musicRoutes = require("./routes/music.routes");
const cors = require("cors");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5175",
  "https://music-app-sepia-theta.vercel.app",
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    const isVercelPreview = /^https:\/\/music-[a-z0-9-]+\.vercel\.app$/i.test(origin || "");
    callback(null, !origin || allowedOrigins.has(origin) || isVercelPreview);
  },
  credentials: true,
}));

// ADDED: A root route to verify the server is live without getting a "Cannot GET /" error
app.get("/", (req, res) => {
  res.send("Music API is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/music", musicRoutes);

module.exports = app;