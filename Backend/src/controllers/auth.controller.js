const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ─── Register ────────────────────────────────────────────────────────────────
async function resgisterUser(req, res) {
  const { username, email, password, role = "user" } = req.body;

  const isUserALreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (isUserALreadyExists) {
    return res.status(409).json({
      message: "user already exists",
    });
  }
  const hash = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    username,
    email,
    password: hash,
    role,
  });
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    message: "user registered successfully",
    user: { id: user._id, username: user.username, role: user.role },
  });
}

// ─── Login ───────────────────────────────────────────────────────────────────
async function loginUser(req, res) {
  const { username, email, password } = req.body;

  const user = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "login successful",
    user: { id: user._id, username: user.username, role: user.role },
  });
}

// ─── Get Me ──────────────────────────────────────────────────────────────────
async function getMe(req, res) {
  return res.status(200).json({ user: req.user });
}

// ─── Logout ──────────────────────────────────────────────────────────────────
async function logoutUser(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });
  return res.status(200).json({ message: "logged out successfully" });
}

// ─── Forgot Password ─────────────────────────────────────────────────────────
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await userModel.findOne({ email });

    // Always return 200 — never reveal whether an email exists
    if (!user) {
      return res.status(200).json({
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Save token + 1-hour expiry to the user document
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Build the reset link pointing to the frontend
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Send email via Nodemailer (Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Music App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔑 Password Reset Request",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2>Password Reset</h2>
          <p>Hi <strong>${user.username}</strong>,</p>
          <p>You requested a password reset. Click the button below. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetLink}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #7c3aed;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 16px 0;
          ">Reset My Password</a>
          <p>Or copy this link:<br/><a href="${resetLink}">${resetLink}</a></p>
          <p style="color:#888; font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

// ─── Reset Password ──────────────────────────────────────────────────────────
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Find user with a matching, non-expired token
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." });
    }

    // Hash new password and clear token fields
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}

module.exports = {
  resgisterUser,
  loginUser,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
};