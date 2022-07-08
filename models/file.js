const mongoose = require('mongoose')
const Schema = mongoose.Schema

// const fileDetailsSchema = new Schema({
//     fileLocation: String,
//     fileSize: Number,
//     fileName: String,
//     fileKey: String,
//     mimetype: String,
//     ranking: Number
// })

// id:userId, fileDetails
const fileSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    fileLocation: String,
    fileSize: Number,
    fileName: String,
    fileKey: String,
    mimetype: String,
    ranking: Number,
    priority: String,
    migration: Boolean,
    cloud: String
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);
module.exports = File;