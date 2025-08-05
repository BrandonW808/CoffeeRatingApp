const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new Error();
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = auth;
