const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User.js');

const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { isAuthenticated } = require('./middleware/auth');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
require('dotenv').config();
const bcryptSalt = bcrypt.genSaltSync(10);
// In index.js and auth.js
const jwtSecret = process.env.JWT_SECRET || 'asfadjsfadiofjkadvdfga';

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
    
};

app.use(cors(corsOptions)); //enables cors for all ports

mongoose.connect(process.env.MONGO_URL, {bufferCommands: false}).then(() => {
    console.log('MongoDB connected successfully');
})
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.get('/test', (req, res) => {
    res.json('test ok');
});

app.post('/register', async (req, res) => {
    const {name, email, password} = req.body;

    try{
        const userDoc = await User.create({
            name,
            email,
            password:bcrypt.hashSync(password, bcryptSalt),
        }); 

        res.json(userDoc);
    } catch (e) {
        res.status(422).json(e);
    }
});

// In your login route
app.post('/login', async (req, res) => {
  const {email, password} = req.body;
    try {
      // Find user by email
    const userDoc = await User.findOne({email});
    
    if (!userDoc) {
      // User not found
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check password
    const passOk = bcrypt.compareSync(password, userDoc.password);
    
    if (!passOk) {
      // Wrong password
      return res.status(401).json({ error: 'Wrong credentials' });
    }
      const jwtSecret = process.env.JWT_SECRET || 'asfadjsfadiofjkadvdfga';
      jwt.sign(
        { id:userDoc._id, email:userDoc.email, name:userDoc.name }, 
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          
          // Set cookie
          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Add this
            maxAge: 30 * 24 * 60 * 60 * 1000
          });
          
          res.json({
            id: userDoc._id,
            email: userDoc.email,
            name: userDoc.name,
            token: token
          });
        }
      );
    } catch (error) {
      // ... error handling
    }
  });

app.get('/profile', isAuthenticated, (req, res) => {
    // Since isAuthenticated middleware sets req.user, we can use it here
    res.json(req.user);
});

app.post('/logout', (req, res) => {
    res.cookie('token', '', {
        expires: new Date(0),
        httpOnly: true
    }).json({ message: 'Logged out successfully' });
});

// Mount file routes
app.use('/api/files', fileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});