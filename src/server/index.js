require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const bodyParser = require('body-parser');

// Import routes
const authRoutes = require('./routes/auth');
const coffeeRoutes = require('./routes/coffee');
const brewRoutes = require('./routes/brew');

const app = express();
const PORT = process.env.PORT || 3002;

// Connect to MongoDB
connectDB();
app.use(cors());

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request from ${req.ip} to ${req.url}`);
  next();
});


app.use(express.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(bodyParser.json({ limit: '50mb' }));

app.use(cookieParser());
const friendsRouter = require('./routes/friends');

// Add after other route definitions
app.use('/api/friends', friendsRouter);
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/coffees', coffeeRoutes);
app.use('/api/brews', brewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(express.static(path.join(__dirname, '../../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
