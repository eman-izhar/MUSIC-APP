const musicModel = require("../models/music.models");
const albumModel = require("../models/album.model");
const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../service/storage.services");

async function createMusic(req, res) {
  const token = req.cookies.token;

  const { title } = req.body;
  const file = req.file;

  const result = await uploadFile(file.buffer.toString("base64")); //base64 is used to convert the file into a string format

  const music = await musicModel.create({
    uri: result.url,
    title,
    artist: req.user.id,
  });
  res.status(201).json({
    message: "music created successfully",
    music: {
      id: music._id,
      uri: music.uri,
      title: music.title,
      artist: music.artist,
    },
  });
}

//........................

async function createAlbum(req, res) {
  const token = req.cookies.token;

  const { title, musicIds } = req.body;
  const album = await albumModel.create({
    title,
    artist: req.user.id,
    musics: musicIds,
  });
  res.status(201).json({
    message: "album created successfully",
    album: {
      id: album._id,
      title: album.title,
      artist: album.artist,
      musics: album.musics,
    },
  });
}

//.........................
async function getAllMusics(req, res) {
  const musics = await musicModel
    .find()
    .limit(20)
    .populate("artist", "username email");

  res.status(200).json({
    message: "musics fetched successfully",
    musics,
  });
}

//........................

async function getAllAlbums(req, res) {
  const albums = await albumModel
    .find()
    .select("title artist")
    .populate("artist", "username email");
  res.status(200).json({
    message: "albums fetched successfully",
    albums,
  });
}

//........................
async function getAllAlbumsById(req, res) {
  const albumsID = req.params.albumsID;
  const albums = await albumModel
    .findById(albumsID)
    .populate("musics", "title uri")
    .populate("artist", "username email");
  res.status(200).json({
    message: "albums fetched successfully",
    albums,
  });
}

async function getFavorites(req, res) {
  const user = await userModel.findById(req.user.id).select("favoriteTracks");
  res.status(200).json({ favorites: user?.favoriteTracks || [] });
}

async function addFavorite(req, res) {
  const { trackId, title, artist, genre, color, uri } = req.body;
  if (!trackId || !title) {
    return res.status(400).json({ message: "trackId and title are required" });
  }

  const favorite = {
    trackId: String(trackId),
    title,
    artist: artist || "Unknown artist",
    genre: genre || "New release",
    color: color || "violet",
    uri: uri || "",
  };
  const user = await userModel.findOneAndUpdate(
    { _id: req.user.id, "favoriteTracks.trackId": { $ne: favorite.trackId } },
    { $push: { favoriteTracks: favorite } },
    { new: true, projection: "favoriteTracks" },
  );

  if (!user) {
    const existingUser = await userModel.findById(req.user.id).select("favoriteTracks");
    return res.status(200).json({ favorites: existingUser?.favoriteTracks || [] });
  }
  res.status(201).json({ favorites: user.favoriteTracks });
}

async function removeFavorite(req, res) {
  const user = await userModel.findByIdAndUpdate(
    req.user.id,
    { $pull: { favoriteTracks: { trackId: String(req.params.trackId) } } },
    { new: true, projection: "favoriteTracks" },
  );
  res.status(200).json({ favorites: user?.favoriteTracks || [] });
}
module.exports = {
  createMusic,
  createAlbum,
  getAllMusics,
  getAllAlbums,
  getAllAlbumsById,
  getFavorites,
  addFavorite,
  removeFavorite,
};
