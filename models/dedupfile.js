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
    id: Schema.ObjectId,
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

const DeDupFile = mongoose.model('Dedup', fileSchema);
module.exports = DeDupFile;