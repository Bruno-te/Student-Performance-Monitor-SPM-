const dotenv = require('dotenv');
const { getDB, initDB } = require('../config/database');
const User = require('../models/User');

// Load env vars
dotenv.config();

const addParents = async () => {
  try {
    // Initialize database
    initDB();
    const db = getDB();

    console.log('Adding parent accounts...\n');

    // Get all students
    const students = await User.find({ role: 'student' });
    
    if (students.length === 0) {
      console.log('❌ No students found! Please add students first.');
      process.exit(1);
    }

    console.log(`Found ${students.length} student(s)\n`);

    // Create parents for each student
    const createdParents = [];
    for (const student of students) {
      // Generate parent email based on student email
      let parentEmail;
      if (student.email.includes('@student.')) {
        parentEmail = student.email.replace('@student.', '@parent.');
      } else {
        // Extract the part before @ and add @parent.edubridge.africa
        const emailParts = student.email.split('@');
        parentEmail = `${emailParts[0]}.parent@edubridge.africa`;
      }
      const parentName = `${student.name.split(' ')[0]} Parent`;
      
      // Check if parent already exists
      let parent = await User.findOne({ email: parentEmail });
      
      if (!parent) {
        parent = await User.create({
          name: parentName,
          email: parentEmail,
          password: 'parent123',
          role: 'parent',
          phone: `+250788${String(student.id).padStart(6, '0')}`
        });
        console.log(`  ✅ Created parent: ${parent.name} (ID: ${parent.id})`);
        console.log(`     Email: ${parent.email}`);
        console.log(`     Password: parent123`);
      } else {
        console.log(`  ⚠️  Parent ${parent.name} already exists`);
      }

      // Link parent to student
      const existingRelation = db.prepare(`
        SELECT * FROM user_relationships WHERE parent_id = ? AND child_id = ?
      `).get(parent.id, student.id);

      if (!existingRelation) {
        await User.linkParent(student.id, parent.id);
        console.log(`  ✅ Linked ${parent.name} to ${student.name}`);
      } else {
        console.log(`  ⚠️  ${parent.name} already linked to ${student.name}`);
      }

      createdParents.push({ parent, student });
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Parent accounts created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Summary:');
    console.log(`   Parents created/linked: ${createdParents.length}`);
    console.log('\n🔑 Parent Login Credentials:');
    createdParents.forEach(({ parent, student }) => {
      console.log(`\n   ${parent.name}:`);
      console.log(`     Email: ${parent.email}`);
      console.log(`     Password: parent123`);
      console.log(`     Child: ${student.name} (${student.email})`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding parents:', error);
    process.exit(1);
  }
};

addParents();

