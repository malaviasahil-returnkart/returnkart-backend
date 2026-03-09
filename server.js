require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const emailRoutes = require('./routes/email');
const orderRoutes = require('./routes/orders');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/email', emailRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'returnkart-backend', timestamp: new Date().toISOString() });
});

// Root — lets Replit's webview know the server is alive
app.get('/', (req, res) => {
  res.json({ message: 'ReturnKart API is running', version: '1.0.0' });
});

// MongoDB connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
    } else {
      console.warn('⚠️  MONGODB_URI not set — running without DB');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
};

// IMPORTANT: Replit requires binding to 0.0.0.0
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

connectDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 ReturnKart backend running at http://${HOST}:${PORT}`);
  });
});
