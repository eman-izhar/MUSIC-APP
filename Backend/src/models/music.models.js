const mongoose = require("mongoose")

const musicSchema = new mongoose.Schema({

uri:{
    type: String,
    required:true
},

title:{
    type:String,
    required: true
},

artist:{
    type: mongoose.Schema.Types.ObjectID, // artist jo jo b music create kate ga us ki id
    ref: "user", //user is  collection ka name data base mai 
    required: true
}



})

const musicModel = mongoose.model("musics", musicSchema)

module.exports = musicModel;