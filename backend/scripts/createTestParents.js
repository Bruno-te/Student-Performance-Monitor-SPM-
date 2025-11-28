const dotenv = require('dotenv');
const { getDB, initDB } = require('../config/database');
const User = require('../models/User');

// Load env vars
dotenv.config();

const createTestParents = async () => {
  try {
    // Initialize database
    initDB();
    const db = getDB();

    console.log('Creating test parent accounts...\n');

    // Get students
    const students = await User.find({ role: 'student' });
    
    if (students.length < 3) {
      console.log('❌ Need at least 3 students. Please run add-test-data first.');
      process.exit(1);
    }

    // Create parents with the email format from README
    const parents = [
      { name: 'Bruno Parent', email: 'bruno.parent@edubridge.africa', phone: '+250788111111', student: students[0] },
      { name: 'Emmy Parent', email: 'emmy.parent@edubridge.africa', phone: '+250788222222', student: students[1] },
      { name: 'Arnold Parent', email: 'arnold.parent@edubridge.africa', phone: '+250788333333', student: students[2] }
    ];

    for (const parentData of parents) {
      // Check if parent already exists
      let parent = await User.findOne({ email: parentData.email });
      
      if (!parent) {
        parent = await User.create({
          name: parentData.name,
          email: parentData.email,
          password: 'parent123',
          role: 'parent',
          phone: parentData.phone
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
      `).get(parent.id, parentData.student.id);

      if (!existingRelation) {
        await User.linkParent(parentData.student.id, parent.id);
        console.log(`  ✅ Linked ${parent.name} to ${parentData.student.name}`);
      } else {
        console.log(`  ⚠️  ${parent.name} already linked to ${parentData.student.name}`);
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test parent accounts created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔑 Parent Login Credentials:');
    parents.forEach((p) => {
      console.log(`\n   ${p.name}:`);
      console.log(`     Email: ${p.email}`);
      console.log(`     Password: parent123`);
      console.log(`     Child: ${p.student.name}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test parents:', error);
    process.exit(1);
  }
};

createTestParents();

