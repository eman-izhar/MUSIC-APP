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

router.get("/", authMiddleware.authAuthenticated, musicController.getAllMusics);
router.get("/albums", authMiddleware.authAuthenticated, musicController.getAllAlbums);
router.get("/albums/:albumsID", authMiddleware.authAuthenticated, musicController.getAllAlbumsById);
router.get("/favorites", authMiddleware.authAuthenticated, musicController.getFavorites);
router.post("/favorites", authMiddleware.authAuthenticated, musicController.addFavorite);
router.delete("/favorites/:trackId", authMiddleware.authAuthenticated, musicController.removeFavorite);

module.exports = router;
