// api/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from cookie OR auth header
    const token = req.cookies?.token || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
                  ? req.headers.authorization.split(' ')[1] : null);
    
    // Debug output
    console.log('Auth middleware called');
    console.log('Cookies received:', req.cookies);
    console.log('Token extracted:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    
    // Use the same JWT secret as in your index.js
    const jwtSecret = process.env.JWT_SECRET || 'asfadjsfadiofjkadvdfga';
    
    try {
      // Verify token
      const decoded = jwt.verify(token, jwtSecret);
      console.log('Decoded token:', decoded);
      
      // Find user
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found. Please log in again.' });
      }
      
      // Set user in request
      req.user = user;
      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
};

module.exports = { isAuthenticated };