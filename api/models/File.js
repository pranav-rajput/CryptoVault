// api/models/File.js

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  encryptedFileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  originalType: {
    type: String,
    default: 'application/octet-stream'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const FileModel = mongoose.model('File', fileSchema);

module.exports = FileModel;