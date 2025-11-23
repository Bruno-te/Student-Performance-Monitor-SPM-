const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDB } = require('../config/database');
const User = require('../models/User');

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const db = getDB();
    let courses;

    if (req.user.role === 'student') {
      courses = db.prepare(`
        SELECT c.*, u.name as teacher_name, u.email as teacher_email
        FROM courses c
        INNER JOIN course_students cs ON c.id = cs.course_id
        INNER JOIN users u ON c.teacher_id = u.id
        WHERE cs.student_id = ? AND c.isActive = 1
      `).all(req.user.id);
      
      // Get students for each course
      courses = courses.map(course => {
        const students = db.prepare(`
          SELECT u.id, u.name, u.email, u.studentId
          FROM users u
          INNER JOIN course_students cs ON u.id = cs.student_id
          WHERE cs.course_id = ?
        `).all(course.id);
        
        return {
          ...course,
          teacher: { name: course.teacher_name, email: course.teacher_email },
          students
        };
      });
    } else if (req.user.role === 'teacher') {
      courses = db.prepare(`
        SELECT c.*, u.name as teacher_name, u.email as teacher_email
        FROM courses c
        INNER JOIN users u ON c.teacher_id = u.id
        WHERE c.teacher_id = ?
      `).all(req.user.id);
      
      courses = courses.map(course => {
        const students = db.prepare(`
          SELECT u.id, u.name, u.email, u.studentId
          FROM users u
          INNER JOIN course_students cs ON u.id = cs.student_id
          WHERE cs.course_id = ?
        `).all(course.id);
        
        return {
          ...course,
          teacher: { name: course.teacher_name, email: course.teacher_email },
          students
        };
      });
    } else if (req.user.role === 'parent') {
      // Get children IDs
      const children = db.prepare(`
        SELECT child_id FROM user_relationships WHERE parent_id = ?
      `).all(req.user.id);
      const childrenIds = children.map(c => c.child_id);

      if (childrenIds.length > 0) {
        courses = db.prepare(`
          SELECT DISTINCT c.*, u.name as teacher_name, u.email as teacher_email
          FROM courses c
          INNER JOIN course_students cs ON c.id = cs.course_id
          INNER JOIN users u ON c.teacher_id = u.id
          WHERE cs.student_id IN (${childrenIds.map(() => '?').join(',')}) AND c.isActive = 1
        `).all(...childrenIds);
      } else {
        courses = [];
      }
      
      courses = courses.map(course => {
        const students = db.prepare(`
          SELECT u.id, u.name, u.email, u.studentId
          FROM users u
          INNER JOIN course_students cs ON u.id = cs.student_id
          WHERE cs.course_id = ?
        `).all(course.id);
        
        return {
          ...course,
          teacher: { name: course.teacher_name, email: course.teacher_email },
          students
        };
      });
    } else {
      courses = db.prepare(`
        SELECT c.*, u.name as teacher_name, u.email as teacher_email
        FROM courses c
        INNER JOIN users u ON c.teacher_id = u.id
      `).all();
      
      courses = courses.map(course => {
        const students = db.prepare(`
          SELECT u.id, u.name, u.email, u.studentId
          FROM users u
          INNER JOIN course_students cs ON u.id = cs.student_id
          WHERE cs.course_id = ?
        `).all(course.id);
        
        return {
          ...course,
          teacher: { name: course.teacher_name, email: course.teacher_email },
          students
        };
      });
    }

    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const db = getDB();
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const teacher = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(course.teacher_id);
    const students = db.prepare(`
      SELECT u.id, u.name, u.email, u.studentId
      FROM users u
      INNER JOIN course_students cs ON u.id = cs.student_id
      WHERE cs.course_id = ?
    `).all(course.id);

    res.json({
      success: true,
      data: {
        ...course,
        teacher,
        students
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private/Teacher/Admin
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const { name, code, description, startDate, endDate } = req.body;

    const result = db.prepare(`
      INSERT INTO courses (name, code, description, teacher_id, startDate, endDate)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, code, description, req.user.id, startDate || new Date().toISOString(), endDate || null);

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
    const teacher = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(course.teacher_id);

    res.status(201).json({
      success: true,
      data: {
        ...course,
        teacher,
        students: []
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private/Teacher/Admin
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, code, description, startDate, endDate, isActive } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (code !== undefined) { updates.push('code = ?'); values.push(code); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (startDate !== undefined) { updates.push('startDate = ?'); values.push(startDate); }
    if (endDate !== undefined) { updates.push('endDate = ?'); values.push(endDate); }
    if (isActive !== undefined) { updates.push('isActive = ?'); values.push(isActive ? 1 : 0); }

    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updatedCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    const teacher = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(updatedCourse.teacher_id);
    const students = db.prepare(`
      SELECT u.id, u.name, u.email, u.studentId
      FROM users u
      INNER JOIN course_students cs ON u.id = cs.student_id
      WHERE cs.course_id = ?
    `).all(updatedCourse.id);

    res.json({
      success: true,
      data: {
        ...updatedCourse,
        teacher,
        students
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/courses/:id/students
// @desc    Add student to course
// @access  Private/Teacher/Admin
router.post('/:id/students', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const { studentId } = req.body;
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if student is already enrolled
    const existing = db.prepare(`
      SELECT * FROM course_students WHERE course_id = ? AND student_id = ?
    `).get(req.params.id, studentId);

    if (!existing) {
      db.prepare('INSERT INTO course_students (course_id, student_id) VALUES (?, ?)').run(req.params.id, studentId);
    }

    const updatedCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    const teacher = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(updatedCourse.teacher_id);
    const students = db.prepare(`
      SELECT u.id, u.name, u.email, u.studentId
      FROM users u
      INNER JOIN course_students cs ON u.id = cs.student_id
      WHERE cs.course_id = ?
    `).all(updatedCourse.id);

    res.json({
      success: true,
      data: {
        ...updatedCourse,
        teacher,
        students
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
