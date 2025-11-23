const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { getDB, initDB } = require('../config/database');

// Load env vars
dotenv.config();

const updateAdminPassword = async () => {
  try {
    // Initialize database
    initDB();
    const db = getDB();

    const newPassword = 'bruno123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Find admin user
    const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@edubridge.africa');

    if (!admin) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    // Update password
    db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, 'admin@edubridge.africa');

    console.log('✅ Admin password updated successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@edubridge.africa');
    console.log('New Password: bruno123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
};

updateAdminPassword();

