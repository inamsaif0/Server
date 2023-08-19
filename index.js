const AWS = require('aws-sdk');
const express = require("express");
const cors = require('cors')
const mongoose = require('mongoose')
const userList = require('./Models/userLists')
const multer = require('multer');
const path = require('path');
const filesupload = require('./Models/fileupload');
const fileupload = require("./Models/fileupload");
const { findDocuments,findNameByEmail } = require('./mongoGetDocs');
// const SP = require('./Models/ServiceProvider.model')
// const References = require('./Models/References')
// const CompletedTransaction = require("./Models/CompletedTransactions");


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
app.use(express.json({limit: '25mb'}));
app.use(express.urlencoded({limit: '25mb', extended: true}));
// const upload = multer({ dest: 'uploads/' });



mongoose.connect("mongodb+srv://otp:inam1234@cluster0.jnbirzy.mongodb.net/?retryWrites=true&w=majority",{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useNewUrlParser:true
});()=>{
    console.log("connected to DB") // should update
}

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
  const {email}=req.query;
  studentName=await findNameByEmail(email) 
  result=await findDocuments(studentName);
  res.json(result)



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

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // Set the maximum file size limit to 10MB

app.post('/audio', upload.single('audio'),(req, res) => {
  const { audio, time,email,name } = req.body;

  const base64Data = audio.replace(/^data:audio\/(.*);base64,/, '');
  let fileName = `audio_${time}.m4a`; // Generate a unique file name
  const alternateName=`${name}.m4a`;
  const bucketName = 'otp-mobile'; // Replace with your S3 bucket name

  if(name)
  {
    fileName=alternateName
  }

  const params = {
    Bucket: bucketName,
    Key: 'otp-audio/'+email+'/'+fileName,
    Body: Buffer.from(base64Data, 'base64'),
    ContentType: 'audio/m4a'
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading audio file:', err);
      res.status(500).json({ error: 'Failed to upload audio file' });
    } else {
      console.log('Audio file uploaded successfully:', data.Location);
      res.json({ success: true });
    }
  });
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
app.listen(3000,()=>{
    console.log("started")
    console.log("connected to DB")
})

