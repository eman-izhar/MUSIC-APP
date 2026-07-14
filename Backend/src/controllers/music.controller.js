const musicModel = require("../models/music.models");
const albumModel = require("../models/album.model");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../service/storage.services");

async function createMusic(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "artist") {
      return res.status(403).json({
        message: "You dont have access to create a music",
      });
    }

    const { title } = req.body;
    const file = req.file;

    const result = await uploadFile(file.buffer.toString("base64")); //base64 is used to convert the file into a string format

    const music = await musicModel.create({
      uri: result.url,
      title,
      artist: decoded.id,
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
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: "unauthorized",
    });
  }
}

async function createAlbum(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      message: "unauthorzed"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "artist") {
      return res.status(403).json({
        message: "you dont have access to create album",
      });
    }

    const {title, musicIds} = req.body;
    const album = await albumModel.create({
      title,
      artist : decoded.id,
      musics: musicIds


    })
    res.status(201).json({
      message:"album created successfully",
      album:{
        id: album._id,
        title: album.id,
        artist: album.artist,
        musics: album.musics,

      }
    })



  } catch (err) {
    console.log(err)
    return res.status(401).json({
      message: "unauthorized",
    });
  }
}

module.exports = { createMusic };
