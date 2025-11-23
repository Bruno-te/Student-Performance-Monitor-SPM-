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
app.use(cors());
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
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

