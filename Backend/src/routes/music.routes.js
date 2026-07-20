const express = require("express");
const musicController = require("../controllers/music.controller");
const authMiddleware = require("../middleware/auth.middleware");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(), // Store the file in memory
});
const router = express.Router();

router.post(
  "/uploadMusic",
  authMiddleware.authArtist,
  upload.single("music"),
  musicController.createMusic,
);
router.post(
  "/uploadAlbum",
  authMiddleware.authArtist,
  musicController.createAlbum,
);

router.get("/", musicController.getAllMusics);
module.exports = router;
