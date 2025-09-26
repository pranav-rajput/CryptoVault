// api/routes/fileRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const { isAuthenticated } = require('../middleware/auth');

// Make sure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Get all files for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user._id }).sort({ uploadDate: -1 });
    res.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Upload a new file
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get metadata from request
    const originalType = req.body.originalType || 'application/octet-stream';
    const originalName = req.body.originalName || req.file.originalname.replace('.encrypted', '');

    // Create file record in database
    const file = new File({
      userId: req.user._id,
      fileName: originalName,
      encryptedFileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      originalType: originalType,
      uploadDate: new Date()
    });

    await file.save();

    res.json({
      success: true,
      file: {
        id: file._id,
        name: originalName,
        size: req.file.size,
        type: originalType,
        uploadDate: file.uploadDate
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download a file
router.get('/download/:id', isAuthenticated, async (req, res) => {
  try {
    // Find file in database
    const file = await File.findOne({ 
      _id: req.params.id,
      userId: req.user._id // Security: Only allow users to download their own files
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Send the encrypted file - client will handle decryption
    res.download(file.filePath, file.fileName + '.encrypted');
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete a file
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    // Find file in database
    const file = await File.findOne({ 
      _id: req.params.id,
      userId: req.user._id // Security: Only allow users to delete their own files
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from disk
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete file record from database
    await File.deleteOne({ _id: file._id });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;