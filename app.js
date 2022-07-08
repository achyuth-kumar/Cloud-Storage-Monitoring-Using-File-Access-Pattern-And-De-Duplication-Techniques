require('dotenv').config()

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const cors = require('cors')
const mongoose = require('mongoose')
const User = require('./models/user')
const File = require('./models/file')
const OtpDB = require('./models/otp')
const DeDupFile = require('./models/dedupfile')
const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const sendMail = require('./email')
const linearRegression = require('./regression')
const fetch = require('node-fetch')

//connect to DB
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => console.log("Connected successfully to DB"))
  .catch(err => console.log(err));


const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

let users = []
let concurrentUsers = [];

app.use(cors({
  origin: "*"
}))
app.set('view-engine', 'ejs')
app.use(express.static(__dirname + '/css'))
app.use(express.static(__dirname + '/js'))
app.use(express.static(__dirname + '/html'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

//AWS Setup
aws.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION
});

const BUCKET = process.env.BUCKET
const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    bucket: BUCKET,
    s3: s3,
    acl: "public-read",
    key: (req, file, cb) => {
      let keyValue = file.originalname;
      cb(null, keyValue)
    }
  })
})

app.get('/', (req, res) => {
  res.render('index.ejs')
})

app.get('/dashboard', checkAuthenticated, (req, res) => {
  console.log(req.user);
  res.render('dashboard.ejs', { name: req.user.userName })
})

app.get('/login', (req, res) => {
  allUsers()
  res.render('login.ejs')
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', (req, res) => {
  res.render('register.ejs')
})

app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = new User({
      userName: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });

    await user.save()
      .then((result) => {
        console.log(result)
      })
      .catch((err) => console.log(err));
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

//upload file
app.get('/upload', checkAuthenticated, (req, res) => {
  res.render('upload.ejs')
})

app.get('/success', checkAuthenticated, (req, res) => {
  res.render('success.ejs')
})

//Hit AWS Endpoints

app.post('/uploadfile', checkAuthenticated, upload.single("file"), async (req, res) => {
  // console.log(req.file)
  // res.send(req.file)
  // res.send(req.file.location)
  try {
    // const file = await File.findOneAndUpdate({ id: mainUser.id }, { $push: { fileDetails: fileData } })
    const dataObj = {
      email: req.user.email,
      fileLocation: req.file.location,
      fileSize: req.file.size,
      fileName: req.file.originalname,
      fileKey: req.file.key,
      mimetype: req.file.mimetype,
      ranking: 0,
      priority: req.body.priority,
      migration: false,
      cloud: "AWS"
    };
    const file = new File(dataObj);
    dataObj.id = file._id;
    const dedupfile = new DeDupFile(dataObj);

    await file.save()
      .then((result) => console.log(result))
      .catch((err) => console.log(err))

    await dedupfile.save()
      .then((result) => console.log(result))
      .catch((err) => console.log(err))

  } catch (err) {
    console.log(err)
  }

  res.redirect('/success');
})

app.get('/list', checkAuthenticated, async (req, res) => {
  // let output = await s3.listObjectsV2({Bucket: BUCKET}).promise()
  // let data = output.Contents.map(item => item.Key)
  // let size = output.Contents.map(item => item.Size)
  try {
    const file = await File.find({ email: req.user.email });
    res.render('read.ejs', { file })
    // res.send(file)
  } catch (err) {
    console.log(err)
  }
})

app.get('/download/:filename', checkAuthenticated, async (req, res) => {
  const filename = req.params.filename;
  let data = await s3.getObject({ Bucket: BUCKET, Key: filename }).promise()
  res.send(data.Body)
})

app.post('/deletefile', checkAuthenticated, async (req, res) => {
  const filename = req.body.key;
  try {
    const file = await File.find({ email: req.user.email, key: filename });
    console.log(file)
    if (file.length <= 1) {
      console.log("IN AWS")
      await s3.deleteObject({ Bucket: BUCKET, Key: filename }).promise() //Delete from AWS
    }
    //Delete from MongoDB
    await File.findOneAndDelete({ email: req.user.email, _id: req.body.id });
    await DeDupFile.findOneAndDelete({ email: req.user.email, _id: req.body.id });
    res.send({
      success: "Success"
    })
  } catch (err) {
    console.log(err)
  }
})

app.get('/delete', checkAuthenticated, async (req, res) => {
  try {
    const file = await File.find({ email: req.user.email });
    res.render('delete.ejs', { file })
    // res.send(file)
  } catch (err) {
    console.log(err)
  }
})


// Extras

app.post('/updaterank', checkAuthenticated, async (req, res) => {
  try {
    const THRESHOLD = 5;
    const key = req.body.key;
    const file = await File.findOneAndUpdate({ email: req.user.email, _id: req.body.id }, { $inc: { ranking: 1 } }, {
      new: true
    });
    const updatedFile = await File.find({ email: req.user.email, _id: req.body.id });
    if (updatedFile[0].ranking > THRESHOLD && file.cloud === "AWS") {
      const file = await File.findOneAndUpdate({ email: req.user.email, _id: req.body.id }, { $set: { migration: true } });
    }
    res.send({
      success: "Success"
    })
  } catch (err) {
    console.log(err)
  }
})

//OTP
app.get('/sendotp', checkAuthenticated, async (req, res) => {
  const OTP = sendMail(req.user.email);
  let otpNew = new OtpDB({
    email: req.user.email,
    otp: OTP
  });

  otpNew.save()
    .then((res) => console.log(res))
    .catch((err) => console.log(err));

  res.send({
    success: "Success"
  });
})

app.post('/verifyotp', checkAuthenticated, async (req, res) => {
  const otpDocs = await OtpDB.find({ email: req.user.email });
  const otpDocsNumber = Number(otpDocs[0].otp)
  const reqOTP = Number(req.body.otp)
  if (otpDocsNumber == reqOTP) {
    const file = await File.find({ _id: req.body.id });
    //Delete OTP file after sucess
    await OtpDB.findOneAndDelete({ email: req.user.email });
    res.json({
      success: true,
      link: file[0].fileLocation
    });
  } else {
    res.json({
      success: false
    });
  }
})


async function allUsers() {
  await User.find()
    .then(result => {
      users = result;
    })
    .catch(err => {
      console.log(err);
    });
}

//Monitor
app.get('/monitor', checkAuthenticated, async (req, res) => {
  const data = await getMonitoringData(req.user.email);
  //Migration Part
  const file = await File.find({ email: req.user.email, migration: true });
  data.file = file;
  res.render('monitor.ejs', { data });
});

async function getMonitoringData(email) {
  const scatterDataArray = await getScatterData();
  const realData = [];
  for (let i = 0; i < scatterDataArray.length; i++) {
    const dummyData = [scatterDataArray[i].x, scatterDataArray[i].y];
    realData.push(dummyData);
  }
  const regressionObject = linearRegression(realData);
  const x = scatterDataArray[scatterDataArray.length - 1].x + 1;
  //Prediction: Forecast
  const prediction = Number(Math.abs(regressionObject.predict(x)[1]));
  //Total Files,Sensitive Files
  const file = await File.find({ email: email });
  let totalFiles = file.length;
  let sensitiveFiles = 0;
  let normalFiles = 0;
  for (let i = 0; i < file.length; i++) {
    if (file[i].priority.toUpperCase() === "SENSITIVE") {
      sensitiveFiles++;
    }
  }
  normalFiles = totalFiles - sensitiveFiles;
  //Requests: AWS,Upload.io
  let totalRequests = 0;
  let postRequests = file.length;
  let getRequests = 0;
  for (let i = 0; i < file.length; i++) {
    getRequests += file[i].ranking;
  }
  totalRequests = getRequests + postRequests;
  const data = {
    prediction,
    totalFiles,
    sensitiveFiles,
    normalFiles,
    totalRequests,
    postRequests,
    getRequests
  }
  return data;
}


//CDN Kind of
app.get('/cdn/:id', async (req, res) => {
  await File.findOneAndUpdate({ _id: req.params.id }, { $inc: { ranking: 1 } });
  const file = await File.find({ _id: req.params.id });
  res.redirect(file[0].fileLocation);
});

//De-Duplication
app.get('/fileleveldeduplication', async (req, res) => {
  const data = await deDuplication();
  res.send({
    text: "Completed",
    bytesSaved: data.bytesSaved,
    totalFilesDeleted: data.totalFilesDeleted
  })
});

async function deDuplication() {
  let saved = 0;
  let totalFiles = 0;
  let sizeArray = [];
  let output = await DeDupFile.find();
  // let data = output.Contents.map(item => item.Key)
  // let size = output.Contents.map(item => item.Size)
  for (let i = 0; i < output.length; i++) {
    sizeArray.push([i, output[i].fileSize]);
  }

  sizeArray.sort(function (a, b) {
    return a[1] - b[1];
  });

  console.log("Ouside: " + sizeArray)

  let index = 0;
  for (let i = 1; i < sizeArray.length; i++) {
    if (sizeArray[index][1] === sizeArray[i][1]) {
      saved += sizeArray[i][1];
      totalFiles += 1;
    } else {
      index++;
    }
  }

  let j = 1;
  let i = 0;
  while( i < sizeArray.length - 1 && j < sizeArray.length) {
      if (sizeArray[i][1] == sizeArray[j][1]) {
        //Do De-Duplication - Change in both Mongo and AWS!
        let indexOne = sizeArray[i][0];
        let indexTwo = sizeArray[j][0];
        const boolean = await compareTwoFiles(output[indexOne].fileLocation, output[indexTwo].fileLocation);
        if (boolean) {
          // Both files have same content
          console.log("First File " + output[indexOne].id + " " + output[indexOne].fileKey)
          console.log("Second File " + output[indexTwo].id + " " + output[indexTwo].fileKey)
          if (output[i].cloud === 'AWS') {
            await s3.deleteObject({ Bucket: BUCKET, Key: output[indexTwo].fileKey }).promise() //Delete from AWS
          }
          const updatedData = await File.findOneAndUpdate({ _id: output[indexTwo].id }, { $set: { fileLocation: output[indexOne].fileLocation } }, {new: true});
          console.log("Updated Data " + updatedData);
          await DeDupFile.findOneAndDelete({ _id: output[indexTwo]._id });
          j++;
          continue;
        } else {
          i = j;
          j++;
        }
      } else {
        i++;
        j++;
      }
  }
  return {
    bytesSaved: saved,
    totalFilesDeleted: totalFiles
  };
}

async function compareTwoFiles(fileLinkOne, fileLinkTwo) {
  let firstData, secondData;

  fetch(fileLinkOne)
    .then((data) => data.text())
    .then((res) => {
      firstData = res
      fetch(fileLinkTwo)
        .then((data) => data.text())
        .then((res) => {
          secondData = res;
        });
    });

  return firstData === secondData;
}

app.get('/linear', async (req, res) => {
  const scatterDataArray = await getScatterData();
  const realData = [];
  console.log(scatterDataArray);
  for (let i = 0; i < scatterDataArray.length; i++) {
    const dummyData = [scatterDataArray[i].x, scatterDataArray[i].y];
    realData.push(dummyData);
  }
  console.log(realData);
  const regressionDataArray = await getRegressionData(realData);
  res.render('linear.ejs', { scatterDataArray, regressionDataArray });
})

async function getRegressionData(scatterData) {
  const regressionDataArray = [];
  const modifiedData = [];
  for (let i = 0; i < scatterData.length; i++) {
    modifiedData.push([scatterData[i].x, scatterData[i].y]);
  }
  let data = linearRegression(modifiedData);
  for (let i = 0; i < data.points.length; i++) {
    regressionDataArray.push({
      x: data.points[i][0],
      y: data.points[i][1]
    })
  }
  return regressionDataArray;
}

async function getScatterData() {
  let scatterDataArray = [];
  const userFiles = await File.find({ email: 'imvmanish19@gmail.com' }); //change to email
  console.log(userFiles)
  let j = 1;
  let currentDay = 1;
  let currentDayCount = 1;
  for (let i = 0; i < userFiles.length - 1; i++) {
    const x = userFiles[i].createdAt.toString().split(' ');
    const y = userFiles[j].createdAt.toString().split(' ');
    if (x[1] === y[1] && x[2] === y[2]) {
      currentDayCount++;

    } else {
      scatterDataArray.push({
        x: currentDay,
        y: currentDayCount
      });
      currentDayCount = 1;
      currentDay++;
    }
    j++;
  }
  scatterDataArray.push({
    x: currentDay,
    y: currentDayCount
  });
  return scatterDataArray;
}

app.post('/migrate', async (req, res) => {
  // await s3.deleteObject({ Bucket: BUCKET, Key: req.body.key }).promise()
  const file = await File.findOneAndUpdate({ email: req.user.email, _id: req.body.id }, { $set: { fileLocation: req.body.fileUrl, migration: true, cloud: "UPLOAD" } });
  res.send("SUCCESS");
})

function runDeDuplicationEvery30Minutes() {
  setInterval(deDuplication,1800000);
}
runDeDuplicationEvery30Minutes();

app.listen(process.env.PORT || 3000)
