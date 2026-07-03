const express = require("express")
const { resgisterUser } = require("../controllers/auth.controller");

const router = express.Router();

router.post('/register', resgisterUser)

module.exports = router;