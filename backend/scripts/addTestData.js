const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { getDB, initDB } = require('../config/database');
const User = require('../models/User');

// Load env vars
dotenv.config();

const addTestData = async () => {
  try {
    // Initialize database
    initDB();
    const db = getDB();

    console.log('Adding test data...\n');

    // Get admin user to use as teacher
    const admin = await User.findOne({ email: 'admin@edubridge.africa' });
    if (!admin) {
      console.log('❌ Admin user not found! Please create admin first.');
      process.exit(1);
    }

    // Add students
    const students = [
      { name: 'Ishimwe Bruno', email: 'ishimwe.bruno@student.edubridge.africa', studentId: 'STU001' },
      { name: 'Gasasira Emmy', email: 'gasasira.emmy@student.edubridge.africa', studentId: 'STU002' },
      { name: 'Uwishema Arnold', email: 'uwishema.arnold@student.edubridge.africa', studentId: 'STU003' }
    ];

    console.log('📚 Adding students...');
    const createdStudents = [];
    for (const studentData of students) {
      // Check if student already exists
      const existing = await User.findOne({ email: studentData.email });
      if (existing) {
        console.log(`  ⚠️  Student ${studentData.name} already exists`);
        createdStudents.push(existing);
      } else {
        const student = await User.create({
          ...studentData,
          password: 'student123',
          role: 'student'
        });
        console.log(`  ✅ Created student: ${student.name} (ID: ${student.id})`);
        createdStudents.push(student);
      }
    }

    // Add teacher
    console.log('\n👨‍🏫 Adding teacher...');
    let teacher = await User.findOne({ email: 'teacher@edubridge.africa' });
    if (!teacher) {
      teacher = await User.create({
        name: 'Dr. John Teacher',
        email: 'teacher@edubridge.africa',
        password: 'teacher123',
        role: 'teacher',
        phone: '+250788123456'
      });
      console.log(`  ✅ Created teacher: ${teacher.name} (ID: ${teacher.id})`);
    } else {
      console.log(`  ⚠️  Teacher already exists`);
    }

    // Add courses
    console.log('\n📖 Adding courses...');
    const courses = [
      {
        name: 'Introduction to Software',
        code: 'ITS101',
        description: 'An introductory course covering software development fundamentals, programming concepts, and software engineering principles.',
        teacher_id: teacher.id
      },
      {
        name: 'Frontend Web Development',
        code: 'FWD201',
        description: 'Learn modern frontend web development including HTML, CSS, JavaScript, React, and responsive design principles.',
        teacher_id: teacher.id
      }
    ];

    const createdCourses = [];
    for (const courseData of courses) {
      // Check if course already exists
      const existing = db.prepare('SELECT * FROM courses WHERE code = ?').get(courseData.code);
      if (existing) {
        console.log(`  ⚠️  Course ${courseData.name} already exists`);
        createdCourses.push(existing);
      } else {
        const result = db.prepare(`
          INSERT INTO courses (name, code, description, teacher_id, startDate)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          courseData.name,
          courseData.code,
          courseData.description,
          courseData.teacher_id,
          new Date().toISOString()
        );

        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
        console.log(`  ✅ Created course: ${course.name} (${course.code}) - ID: ${course.id}`);
        createdCourses.push(course);
      }
    }

    // Enroll all students in all courses
    console.log('\n👥 Enrolling students in courses...');
    for (const course of createdCourses) {
      for (const student of createdStudents) {
        // Check if already enrolled
        const existing = db.prepare(`
          SELECT * FROM course_students WHERE course_id = ? AND student_id = ?
        `).get(course.id, student.id);

        if (!existing) {
          db.prepare('INSERT INTO course_students (course_id, student_id) VALUES (?, ?)').run(course.id, student.id);
          console.log(`  ✅ Enrolled ${student.name} in ${course.name}`);
        } else {
          console.log(`  ⚠️  ${student.name} already enrolled in ${course.name}`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test data added successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Summary:');
    console.log(`   Students: ${createdStudents.length}`);
    console.log(`   Courses: ${createdCourses.length}`);
    console.log(`   Teacher: ${teacher.name}`);
    console.log('\n🔑 Login Credentials:');
    console.log('   Teacher:');
    console.log('     Email: teacher@edubridge.africa');
    console.log('     Password: teacher123');
    console.log('\n   Students:');
    students.forEach((s, idx) => {
      console.log(`     ${s.name}:`);
      console.log(`       Email: ${s.email}`);
      console.log(`       Password: student123`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test data:', error);
    process.exit(1);
  }
};

addTestData();

