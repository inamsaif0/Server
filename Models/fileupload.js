const mongoose = require('mongoose')
// import { StringDecoder } from "string_decoder"

const filesupload = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
      },
      filepath: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },


})

module.exports = mongoose.models['files'] || mongoose.model('files',filesupload);