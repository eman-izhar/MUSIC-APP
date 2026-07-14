const express = require("express")
const musicController = require("../controllers/music.controller")
const multer = require ("multer")

const upload = multer({
    storage: multer.memoryStorage() // Store the file in memory
})
const router = express.Router();

router.post("/uploadMusic", upload.single("music"), musicController.createMusic)

module.exports = router;