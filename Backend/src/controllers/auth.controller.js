const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function setAuthCookie(res, user) {
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
}


// ─── Register ────────────────────────────────────────────────────────────────
async function resgisterUser(req, res) {
  const { username, email, password, role = "user" } = req.body;

  const isUserALreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (isUserALreadyExists) {
    return res.status(409).json({ message: "user already exists" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.create({ username, email, password: hash, role });

  setAuthCookie(res, user);

  return res.status(201).json({
    message: "user registered successfully",
    user: { id: user._id, username: user.username, role: user.role },
  });
}

// ─── Login ───────────────────────────────────────────────────────────────────
async function loginUser(req, res) {
  const { username, email, password } = req.body;

  const user = await userModel.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  setAuthCookie(res, user);

  return res.status(200).json({
    message: "login successful",
    user: { id: user._id, username: user.username, role: user.role },
  });
}

// ─── Google Login ───────────────────────────────────────────────────────────
async function loginWithGoogle(req, res) {
  try {
    const { credential } = req.body;
    if (!credential || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ message: "Google login is not configured." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      return res.status(401).json({ message: "Google account could not be verified." });
    }

    let user = await userModel.findOne({
      $or: [{ googleId: payload.sub }, { email: payload.email }],
    });

    if (!user) {
      const baseUsername = (payload.email.split("@")[0] || "listener")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .slice(0, 24) || "listener";
      let username = baseUsername;
      let suffix = 1;
      while (await userModel.exists({ username })) {
        username = `${baseUsername}${suffix++}`;
      }
      user = await userModel.create({
        username,
        email: payload.email,
        googleId: payload.sub,
        role: "user",
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await user.save();
    }

    setAuthCookie(res, user);
    return res.status(200).json({
      message: "Google login successful",
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({ message: "Google login failed." });
  }
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

    // Always return 200 — never reveal whether email exists
    if (!user) {
      return res.status(200).json({
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

const resetLink = `${process.env.FRONTEND_URL}/#/reset-password/${token}`;

    const emailHtml = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
          <h2 style="color:#7c3aed;">Password Reset</h2>
          <p>Hi <strong>${user.username}</strong>,</p>
          <p>You requested a password reset. Click the button below.
             This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetLink}" style="
            display:inline-block;
            padding:12px 28px;
            background:#7c3aed;
            color:white;
            border-radius:8px;
            text-decoration:none;
            font-weight:bold;
            margin:16px 0;
            font-size:15px;
          ">Reset My Password</a>
          <p style="margin-top:16px;">
            Or copy this link:<br/>
            <a href="${resetLink}" style="color:#7c3aed;">${resetLink}</a>
          </p>
          <p style="color:#999;font-size:12px;margin-top:24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `;

    if (process.env.BREVO_API_KEY) {
    // ── Send via Brevo HTTP API (no SDK needed) ──────────────────
const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: {
    "accept": "application/json",
    "api-key": process.env.BREVO_API_KEY,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    sender: { name: "Music App", email: process.env.EMAIL_USER },
    to: [{ email: user.email, name: user.username }],
    subject: "🔑 Password Reset Request",
    htmlContent: emailHtml,
  }),
});

if (!brevoRes.ok) {
  const errData = await brevoRes.json();
  console.error("Brevo error:", errData);
  throw new Error("Failed to send email");
}
// ─────────────────────────────────────────────────────────────
    }

    return res.status(200).json({
      message: "If that email is registered, a reset link has been sent.",
    });
} catch (err) {
  console.error("forgotPassword error:", err);
  return res.status(500).json({ message: err.message }); // temporary debug
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

    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." });
    }

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
  loginWithGoogle,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
};