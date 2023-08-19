const mongoose = require('mongoose')
// import { StringDecoder } from "string_decoder"

const userListSchema = new mongoose.Schema({
    studentName:{
        type:String

    },
    studentId:{
        type:String

    },
    password:{
        type:String
    },
    level:{
        type:String
    },
    status:{
        type:Boolean
    },
    audio : { type : Array , "default" : [] },
    doc: { type : Array , "default" : [] }


})

module.exports = mongoose.models['userList'] || mongoose.model('userList',userListSchema);