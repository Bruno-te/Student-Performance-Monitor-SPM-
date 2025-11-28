const dotenv = require('dotenv');
const { initDB } = require('../config/database');
const User = require('../models/User');

// Load env vars
dotenv.config();

const createAdmin = async () => {
  try {
    // Initialize database
    initDB();
    console.log('Database initialized');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@edubridge.africa' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@edubridge.africa');
      console.log('Password: (the one you set previously)');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@edubridge.africa',
      password: 'bruno123', // Change this password after first login!
      role: 'admin',
      phone: '+1234567890',
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@edubridge.africa');
    console.log('Password: bruno123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
