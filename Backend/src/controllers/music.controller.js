const musicModel = require("../models/music.models");
const albumModel = require("../models/album.model");
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
async function getAllMusics(req, res){

const musics = await musicModel.find() //populate("artist", "username email") //populate artist field with username and email

res.status(200).json({
  message:"musics fetched successfully",
musics
})
}
module.exports = { createMusic, createAlbum, getAllMusics};
