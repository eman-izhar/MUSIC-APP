const express = require("express")
const authController = require("../controllers/auth.controller")
const { authAuthenticated } = require("../middleware/auth.middleware")
const router = express.Router();

router.post('/register', authController.resgisterUser )
router.post('/login', authController.loginUser )
router.post('/logout', authController.logOutUser )
router.get('/me', authAuthenticated, authController.getCurrentUser )

module.exports = router;