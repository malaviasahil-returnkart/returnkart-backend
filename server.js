require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const emailRoutes = require('./routes/email');
const orderRoutes = require('./routes/orders');

const app = express();

// CORS — allow requests from any Replit frontend
const allowedOrigins = [
  'https://c70c6c2e-0271-4eeb-96cb-8a803ade214c-00-3k0k1yqh80n4w.worf.replit.dev',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Also allow any replit.dev subdomain
    if (origin.endsWith('.replit.dev')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Routes
app.use('/api/email', emailRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'returnkart-backend', timestamp: new Date().toISOString() });
});

// Root
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

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

connectDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 ReturnKart backend running at http://${HOST}:${PORT}`);
  });
});
