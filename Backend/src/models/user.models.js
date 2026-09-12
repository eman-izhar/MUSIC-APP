const mongoose = require("mongoose");

const favoriteTrackSchema = new mongoose.Schema(
  {
    trackId: { type: String, required: true },
    title: { type: String, required: true },
    artist: { type: String, default: "Unknown artist" },
    genre: { type: String, default: "New release" },
    color: { type: String, default: "violet" },
    uri: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  role: {
    type: String,
    enum: ["user", "artist"],
    default: "user",
  },
  profileImage: {
    type: String,
    default: "",
  },
  favoriteTracks: {
    type: [favoriteTrackSchema],
    default: [],
  },
  // ── Forgot Password fields ──────────────────────────────
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  // ────────────────────────────────────────────────────────
});

module.exports = mongoose.model("User", userSchema);