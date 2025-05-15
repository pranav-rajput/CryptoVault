const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const File = require('../models/File');
const { isAuthenticated } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
require('dotenv').config();

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure multer to use temporary local storage before S3 upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '../temp');
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueFileName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
});

// Setup the upload middleware
const upload = multer({ storage: storage });

// Get all files for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log('File list request received');
    console.log('User requesting files:', req.user._id);
    
    const files = await File.find({ userId: req.user._id }).sort({ uploadDate: -1 });
    
    console.log('Files found:', files.length);
    
    res.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Upload a new file
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    console.log('File upload request received');
    console.log('Authenticated user:', req.user._id);
    
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File received locally:', req.file);

    // Get metadata from request
    const originalType = req.body.originalType || 'application/octet-stream';
    const originalName = req.body.originalName || req.file.originalname.replace('.encrypted', '');
    
    // Upload file to S3
    const fileContent = fs.readFileSync(req.file.path);
    const s3Key = `${Date.now()}-${req.file.filename}`;
    
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME || 'cryptovault-app-files',
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/octet-stream'
    };
    
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Generate the S3 URL
    const s3Location = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${s3Key}`;
    
    // Create file record in database
    const file = new File({
      userId: req.user._id,
      fileName: originalName,
      encryptedFileName: req.file.filename,
      s3Key: s3Key,
      s3Location: s3Location,
      fileSize: req.file.size,
      originalType: originalType,
      uploadDate: new Date()
    });

    console.log('File document to save:', file);

    const savedFile = await file.save();
    console.log('File document saved with ID:', savedFile._id);
    
    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      file: {
        id: savedFile._id,
        name: originalName,
        size: req.file.size,
        type: originalType,
        uploadDate: savedFile.uploadDate,
        location: s3Location
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload file: ' + error.message });
  }
});

// Download a file
router.get('/download/:id', isAuthenticated, async (req, res) => {
  try {
    const file = await File.findOne({ 
      _id: req.params.id,
      userId: req.user._id
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get file from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || 'cryptovault-app-files',
      Key: file.s3Key
    };

    try {
      const command = new GetObjectCommand(params);
      const s3Object = await s3Client.send(command);

      // Set headers
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.fileName}.encrypted"`,
        'Content-Length': s3Object.ContentLength
      });

      // Stream the data to the response
      const stream = s3Object.Body;
      if (stream instanceof Readable) {
        stream.pipe(res);
      } else {
        // For non-stream response (like with smaller files)
        const chunks = [];
        for await (const chunk of s3Object.Body) {
          chunks.push(chunk);
        }
        res.send(Buffer.concat(chunks));
      }
    } catch (s3Error) {
      console.error('Error getting file from S3:', s3Error);
      return res.status(404).json({ error: 'File not found in storage' });
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Generate a presigned URL for direct download
router.get('/presigned/:id', isAuthenticated, async (req, res) => {
  try {
    const file = await File.findOne({ 
      _id: req.params.id,
      userId: req.user._id
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || 'cryptovault-app-files',
      Key: file.s3Key,
      ResponseContentDisposition: `attachment; filename="${file.fileName}.encrypted"`
    });
    
    // URL expires in 15 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    res.json({
      success: true,
      url: signedUrl,
      fileName: `${file.fileName}.encrypted`
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});

// Delete a file
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const file = await File.findOne({ 
      _id: req.params.id,
      userId: req.user._id
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || 'cryptovault-app-files',
      Key: file.s3Key
    };

    try {
      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);
      console.log(`File deleted from S3: ${file.s3Key}`);
    } catch (s3Error) {
      console.error('Error deleting file from S3:', s3Error);
      // Continue with deletion from database even if S3 deletion fails
    }

    // Delete file record from database
    await File.deleteOne({ _id: file._id });
    console.log(`File record deleted from database: ${file._id}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;