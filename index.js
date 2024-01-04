const AWS = require('aws-sdk');
const express = require("express");
const cors = require('cors')
const mongoose = require('mongoose')
const userList = require('./Models/userLists')
const multer = require('multer');
const path = require('path');
const filesupload = require('./Models/fileupload');
const fileupload = require("./Models/fileupload");
const { findDocuments,findNameByEmail, findAllTeachers, connectToDatabase } = require('./mongoGetDocs');
// const SP = require('./Models/ServiceProvider.model')
// const References = require('./Models/References')
// const CompletedTransaction = require("./Models/CompletedTransactions");
const { MongoClient } = require('mongodb')

const s3 = new AWS.S3({
  accessKeyId: "AKIA5FUXJXFEIHM7O4FR",
  secretAccessKey: "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",
  region:'ap-northeast-1'
  });

  const BUCKET='otp';
  

const app = express();
//app.use(express.json());
app.use(express.urlencoded());
app.use(cors());
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb', extended: true}));
// const upload = multer({ dest: 'uploads/' });



// mongoose.connect("mongodb+srv://otp:inam1234<password>@cluster0.jnbirzy.mongodb.net/?retryWrites=true&w=majority", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }, (err) => {
//   if (err) {
//     console.error("Error connecting to DB:", err);
//   } else {
//     console.log("Connected to DB");
//   }
// });

const uri = 'mongodb+srv://otp:inam1234@cluster0.jnbirzy.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB connection URI
const dbName = 'test'; // Replace with your database name

// // Create a MongoDB connection pool
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Adjust the maximum pool size as per your requirements
};
mongoose.connect(
  uri,
  options
)
.then(()=>console.log('connected'))
.catch(e=>console.log(e));

// const client = new MongoClient(uri, options);
// let db; // Declare a global variable to store the database instance

// // Function to connect to the MongoDB database
// const connectToDatabase = async () => {
//   try {
//     if (!db) {
//       await client.connect();
//       db = client.db(dbName);
//       console.log('Connected to the database');
//     }
//     return db;
//   } catch (error) {
//     console.error('Error connecting to the database:', error);
//   }
// };


// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, Date.now() + ext);
//   }
// });

  
  

app.get('/documents',async(req,res)=>{
  const con = await connectToDatabase();

  const {email}=req.query;
  studentName=await findNameByEmail(email) 
  result=await findDocuments(studentName);
  res.json(result)
})

app.get('/getTeachers', async(req, res) => {
  let data = await findAllTeachers();
  // return data;
  res.status(200).json({data})
})

app.get('/audio', async (req, res) => {
  const { email } = req.query;
  const bucketName = 'otp-mobile';
  const prefix = "otp-audio/" + email + "/";

  try {
    const params = {
      Bucket: bucketName,
      Delimiter: '/',
      Prefix: prefix
    };

    const data = await s3.listObjectsV2(params).promise();
    const audioFiles = data.Contents.filter(file => file.Key.endsWith('.m4a'));
    
    // Sort the audio files by LastModified date
    audioFiles.sort((a, b) => b.LastModified - a.LastModified);

    const fileKeys = audioFiles.map(obj => obj.Key);
    res.json(fileKeys);
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } }); // Set the maximum file size limit to 100MB


const AudioFiles = require('./Models/audioFiles')
const Teacher = require('./Models/teachers');
const audioFiles = require('./Models/audioFiles');

app.post('/audio', upload.single('audio'), async (req, res) => {
  const { audio, time, email, name, teacherData } = req.body;
  // console.log(audio, time, email, name, teacherData, 'Dataaaaaaaaaaaaaaa')
  let obj = {};
  // let link;

  const base64Data = audio.replace(/^data:audio\/(.*);base64,/, '');
  let fileName = `audio_${time}.m4a`; // Generate a unique file name
  const alternateName = `${name}.m4a`;
  const bucketName = 'otp-mobile'; // Replace with your S3 bucket name

  if (name) {
    fileName = alternateName;
  }

  const params = {
    Bucket: bucketName,
    Key: 'otp-audio/' + email + '/' + fileName,
    Body: Buffer.from(base64Data, 'base64'),
    ContentType: 'audio/m4a',
  };
  console.log('ffffffffffffffffffffffffffffffffffff')
  s3.upload(params, async (err, data) => {
    if (err) {
      console.error('Error uploading audio file:', err);
      res.status(500).json({ error: 'Failed to upload audio file' });
    } else {
      obj.audioLink = data.Location; // Assign S3 location to obj.audioLink
      obj.teacherEmail = teacherData.email;
      obj.time = time;
      obj.ownerEmail = email;
      obj.key = params.Key;
      obj.status = null
      console.log('Audio file uploaded successfully:', data.Location);

      try {
        // Create a new instance of the audioFiles document
        const newAudioFile = new AudioFiles(obj);
        console.log(obj)
        // Save the document to the database
        const savedAudioFile = await newAudioFile.save();

        res.json(savedAudioFile);
      } catch (error) {
        console.error('Error adding audio file:', error);
        res.status(500).send('Internal Server Error');
      }
      console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
    }
  });
});
app.post('/delete-audio', async (req, res) => {
  const { filename, email } = req.body; // Assuming the filename is provided in the request body
  const bucketName = 'otp-mobile'; // Replace with your S3 bucket name
  // const key = 'otp-audio/' + filename;
  const params = {
    Bucket: bucketName,
    Key: 'otp-audio/' + email + '/' + filename,
    // ContentType: 'audio/m4a',

  };
  console.log('data',filename, email)

  try {
    // Delete the object from the S3 bucket
    // console.log('data', params)
    await s3.deleteObject(params).promise();
    console.log(`Recording ${filename} deleted successfully from S3`);

    // You can also delete the corresponding entry from your database if needed
    let data = await audioFiles.deleteOne({ key: params.Key});

    res.status(200).json({ message: `Recording ${filename} deleted successfully`, data });
  } catch (error) {
    console.error(`Error deleting recording ${filename} from S3:`, error);
    res.status(500).json({ error: 'Failed to delete recording from S3' });
  }
});

// const upload = multer({
//   storage: multer.diskStorage({
//     destination: function(req, file, cb) {
//       cb(null, "upload")
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.fieldname + "-" + Date.now() + ",jpg")
//     }
//   })
// }).single("file")
// const upload = multer({ dest: "uploads/" });

// app.post('/uploaddata', upload, (req, res) => {
//     res.send('File upload')
//   // return res.redirect("/");
//   // File was uploaded successfully
//   // res.send('File uploaded!');
// });

// app.post('/uploadaudio/:id', upload, async (req, res) => {
//   try {
//     const documentId = req.params.id;
//     const file = req.file;

//     // Save the file information to the document in MongoDB
//     const document = await userList.findById(documentId);
//     if (!document) {
//       return res.status(404).json({ error: 'Document not found' });
//     }

//     document.audio.push({ file: file });
//     await document.save();

//     res.json({ message: 'File uploaded successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to upload file' });
//   }
// });


// app.post('/upload', async (req, res) => {
//   console.log('Hi')
//   // try {
//   //   if (!req.file) {
//   //     return res.status(400).json({ error: 'No file uploaded' });
//   //   }

//   //   const { filename, path: filePath } = req.file;

//   //   // Create a new recording document
//   //   const recording = new fileupload({
//   //     filename: filename,
//   //     filepath: filePath,
//   //   });

//   //   // Save the recording to the database
//   //   await recording.save();

//   //   return res.status(200).json({ message: 'File uploaded successfully' });
//   // } catch (error) {
//   //   console.error(error);
//   //   return res.status(500).json({ error: 'Failed to upload file' });
//   // }
// });


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(email+password)
    try {
      console.log("login happening")
      const user = await userList.findOne({ studentId: email, password: password });
      console.log(user)
      if (user.status===true) {
        res.json({
          success: true,
          message: user
        });
      }
      else if(user.status===false){
        res.json({
          success:false,
          message:"blocked"
        })

      }
      else {
        res.json({
          success: false,
          message: 'Invalid Email or Password'
        });
      }
    } catch (err) {
      res.json({
        success: false,
        message: err.message
      });
    }
  });
  

  ///////////////////////////////////////////////////////////////////////
  // app.post('/record', upload.single('audio'), (req, res) => {
  //   const { originalname, duration, path: filePath } = req.file;
  
  //   // Save recording to the database
  //   const recording = new fileupload({
  //     name: originalname,
  //     duration,
  //     filePath,
  //   });
  
  //   recording.save((err) => {
  //     if (err) {
  //       console.error('Error saving recording:', err);
  //       res.status(500).json({ error: 'Error saving recording' });
  //     } else {
  //       res.status(200).json({ message: 'Recording saved successfully' });
  //     }
  //   });
  // });
  
  // API endpoint for retrieving recordings
  app.get('/recordings', (req, res) => {
    Recording.find({}, (err, recordings) => {
      if (err) {
        console.error('Error retrieving recordings:', err);
        res.status(500).json({ error: 'Error retrieving recordings' });
      } else {
        res.status(200).json(recordings);
      }
    });
  });
  
  // Serve the uploaded files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//
app.listen(3001,()=>{
    console.log("started")
    // console.log("connected to DB")
})

