const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'edubridge.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
const initDB = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'parent', 'teacher', 'admin')),
      phone TEXT,
      studentId TEXT UNIQUE,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User relationships (parent-child)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER NOT NULL,
      child_id INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(parent_id, child_id)
    )
  `);

  // Courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      teacher_id INTEGER NOT NULL,
      startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      endDate DATETIME,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `);

  // Course students (many-to-many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS course_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(course_id, student_id)
    )
  `);

  // Assignments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      course_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      dueDate DATETIME NOT NULL,
      maxScore INTEGER NOT NULL DEFAULT 100,
      attachments TEXT,
      isPublished INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `);

  // Submissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      content TEXT,
      attachments TEXT,
      submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'late', 'graded')),
      isLate INTEGER DEFAULT 0,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id),
      UNIQUE(assignment_id, student_id)
    )
  `);

  // Grades table
  db.exec(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      assignment_id INTEGER,
      submission_id INTEGER,
      score REAL NOT NULL,
      maxScore REAL NOT NULL DEFAULT 100,
      percentage REAL NOT NULL,
      grade TEXT NOT NULL CHECK(grade IN ('A', 'B', 'C', 'D', 'F')),
      feedback TEXT,
      gradedBy_id INTEGER NOT NULL,
      gradedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      parentNotified INTEGER DEFAULT 0,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id),
      FOREIGN KEY (submission_id) REFERENCES submissions(id),
      FOREIGN KEY (gradedBy_id) REFERENCES users(id)
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      readAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    )
  `);

  // Attendance table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      status TEXT NOT NULL DEFAULT 'absent' CHECK(status IN ('present', 'absent', 'late', 'excused')),
      markedBy_id INTEGER NOT NULL,
      notes TEXT,
      parentNotified INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (markedBy_id) REFERENCES users(id)
    )
  `);

  console.log('✅ Database initialized successfully');
};

// Initialize on first load
initDB();

const getDB = () => db;

const closeDB = () => {
  db.close();
};

module.exports = { getDB, closeDB, initDB };
