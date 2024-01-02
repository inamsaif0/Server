// import mongoose from "mongoose";
const mongoose = require('mongoose')


const Teachers = new mongoose.Schema({
   
    email:
    {
        type:String, 
    },
    password:
    {
        type:String, 
    },
    teacherName:
    {
        type:String, 
    },
    role:
    {
        type:String, 
    }
})

module.exports = mongoose.models['teachers'] || mongoose.model('teachers',Teachers);