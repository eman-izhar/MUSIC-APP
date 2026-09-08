const express = require("express");
const authController = require("../controllers/auth.controller");
const { authAuthenticated } = require("../middleware/auth.middleware");
const router = express.Router();

// ─── Existing routes ──────────────────────────────────────
router.post("/register", authController.resgisterUser);
router.post("/login", authController.loginUser);
router.post("/google", authController.loginWithGoogle);
router.get("/me", authAuthenticated, authController.getMe);
router.post("/logout", authController.logoutUser);

// ─── Forgot / Reset Password (NEW) ───────────────────────
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;