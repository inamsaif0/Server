const mongoose = require('mongoose')
const AudioFiles = new mongoose.Schema({
   
    audioLink:
    {
        type:String, 
    },
    ownerEmail:
    {
        type:String, 
    },
    teacherEmail:
    {
        type:String, 
    },
    status:{
        type: String,
    },
    time:
    {
        type:String, 
    }
})

module.exports = mongoose.models['audioFiles'] || mongoose.model('audioFiles',AudioFiles);