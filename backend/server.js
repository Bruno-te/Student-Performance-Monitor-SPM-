const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { initDB } = require('./config/database');

// Load env vars
dotenv.config();

// Initialize database
initDB();

const app = express();

// Middleware
// CORS configuration - allow localhost for development and deployed frontend URLs in production
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://student-performance-monitor-spm-1.onrender.com', // your Render frontend
  process.env.FRONTEND_URL // optional override for custom domain
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile apps)
      if (!origin) return callback(null, true);

      // In development, allow everything from localhost
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/attendance', require('./routes/attendance'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EduBridge Africa API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

