const imagekit = require("@imagekit/nodejs");

const imageKitClient = new imagekit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,

});

async function uploadFile(file) {
  //file is coming from the frontend
  const result = await imageKitClient.files.upload({
    file,
    fileName: "music_" + Date.now(), //unique filename
    folder: "allmusics/songs",
  });
  return result;
}

module.exports = { uploadFile };
