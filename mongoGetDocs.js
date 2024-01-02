const { MongoClient } = require('mongodb');
const userLists = require('./Models/userLists');
const mongoose = require('mongoose')
const uri = 'mongodb+srv://otp:inam1234@cluster0.jnbirzy.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB connection URI
const dbName = 'test'; // Replace with your database name

// Create a MongoDB connection pool
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Adjust the maximum pool size as per your requirements
};

mongoose.connect(
  uri,
  options
)
const client = new MongoClient(uri, options);
let db; // Declare a global variable to store the database instance

// Function to connect to the MongoDB database
const connectToDatabase = async () => {
  try {
    if (!db) {
      await client.connect();
      db = client.db(dbName);
      console.log('Connected to the database');
    }
    return db;
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};
const audioFiles = require('./Models/audioFiles')

// Example function to find documents in a collection
const findDocuments = async (name) => {
  const db = await connectToDatabase();
  const collection = db.collection('uploadfiles');

  try {
    const query = { student: name };
    const projection = {
      filename: 1,
      fileUrl: 1,
      teacher: 1,
      date: 1,
      level: 1,
      _id: 1,
    };
    const result = await collection
      .find(query)
      .sort({ date: -1 })
      .project(projection)
      .toArray();
    return result;
  } catch (error) {
    console.error('Error finding documents:', error);
  }
};

const findNameByEmail = async (email) => {
  const db = await connectToDatabase();
  const collection = db.collection('userlists');
  console.log(collection)
  try {
    const query = { studentId: email };
    const projection = { studentName: 1, _id: 0 };
    const result = await collection.find(query).project(projection).toArray();
    if (result.length > 0) {
      return result[0].studentName;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error finding documents:', error);
    return null;
  }
};

const findAllTeachers = async () => {
  const db = await connectToDatabase();
  const collection = db.collection('teachers'); // Corrected this line
  const teachers = await collection.find().toArray(); // Corrected this line
  console.log('....................', teachers);
  return teachers;
};

const createAudio = async (audio,email, teacherData , time) => {
  // const collection = db.collection('audioFiles'); // Corrected this line
  // let data = audioFiles.create()
  try {
    // const db = await connectToDatabase();

    const newAudioFile = new audioFiles({
      audioLink:audio,
      ownerEmail:email,
      teacherName:teacherData,
      time:time,
      status: null
    });

    // Save the new document to the database
    const savedAudioFile = await newAudioFile.save();

    return savedAudioFile
    // res.status(201).json(savedAudioFile);
  } catch (error) {
    console.error('Error adding audio file:', error);
    // res.status(500).send('Internal Server Error');
    return error
  }

}
module.exports = {
  findDocuments,
  findNameByEmail,
  findAllTeachers,
  createAudio,
  connectToDatabase
  
};
