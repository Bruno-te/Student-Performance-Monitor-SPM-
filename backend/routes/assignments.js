const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDB } = require('../config/database');

// @route   GET /api/assignments
// @desc    Get all assignments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const db = getDB();
    let assignments;

    if (req.user.role === 'student') {
      // Get assignments for courses the student is enrolled in
      const courseIds = db.prepare(`
        SELECT course_id FROM course_students WHERE student_id = ?
      `).all(req.user.id).map(c => c.course_id);

      if (courseIds.length > 0) {
        assignments = db.prepare(`
          SELECT a.*, c.name as course_name, c.code as course_code,
                 u.name as teacher_name, u.email as teacher_email
          FROM assignments a
          INNER JOIN courses c ON a.course_id = c.id
          INNER JOIN users u ON a.teacher_id = u.id
          WHERE a.course_id IN (${courseIds.map(() => '?').join(',')}) AND a.isPublished = 1
        `).all(...courseIds);
      } else {
        assignments = [];
      }
    } else if (req.user.role === 'teacher') {
      assignments = db.prepare(`
        SELECT a.*, c.name as course_name, c.code as course_code,
               u.name as teacher_name, u.email as teacher_email
        FROM assignments a
        INNER JOIN courses c ON a.course_id = c.id
        INNER JOIN users u ON a.teacher_id = u.id
        WHERE a.teacher_id = ?
      `).all(req.user.id);
    } else if (req.user.role === 'parent') {
      // Get assignments for parent's children's courses
      const children = db.prepare(`
        SELECT child_id FROM user_relationships WHERE parent_id = ?
      `).all(req.user.id);
      const childrenIds = children.map(c => c.child_id);

      if (childrenIds.length > 0) {
        const courseIds = db.prepare(`
          SELECT DISTINCT course_id FROM course_students 
          WHERE student_id IN (${childrenIds.map(() => '?').join(',')})
        `).all(...childrenIds).map(c => c.course_id);

        if (courseIds.length > 0) {
          assignments = db.prepare(`
            SELECT a.*, c.name as course_name, c.code as course_code,
                   u.name as teacher_name, u.email as teacher_email
            FROM assignments a
            INNER JOIN courses c ON a.course_id = c.id
            INNER JOIN users u ON a.teacher_id = u.id
            WHERE a.course_id IN (${courseIds.map(() => '?').join(',')}) AND a.isPublished = 1
          `).all(...courseIds);
        } else {
          assignments = [];
        }
      } else {
        assignments = [];
      }
    } else {
      assignments = db.prepare(`
        SELECT a.*, c.name as course_name, c.code as course_code,
               u.name as teacher_name, u.email as teacher_email
        FROM assignments a
        INNER JOIN courses c ON a.course_id = c.id
        INNER JOIN users u ON a.teacher_id = u.id
      `).all();
    }

    assignments = assignments.map(a => ({
      ...a,
      course: { name: a.course_name, code: a.course_code },
      teacher: { name: a.teacher_name, email: a.teacher_email }
    }));

    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get single assignment
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const db = getDB();
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student has access to this assignment
    if (req.user.role === 'student') {
      const course = db.prepare(`
        SELECT c.* FROM courses c
        INNER JOIN course_students cs ON c.id = cs.course_id
        WHERE c.id = ? AND cs.student_id = ?
      `).get(assignment.course_id, req.user.id);
      
      if (!course) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const course = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(assignment.course_id);
    const teacher = db.prepare('SELECT name, email FROM users WHERE id = ?').get(assignment.teacher_id);

    res.json({
      success: true,
      data: {
        ...assignment,
        course,
        teacher
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/assignments
// @desc    Create new assignment
// @access  Private/Teacher/Admin
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const { title, description, course, dueDate, maxScore, attachments, isPublished } = req.body;

    const result = db.prepare(`
      INSERT INTO assignments (title, description, course_id, teacher_id, dueDate, maxScore, attachments, isPublished)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      course,
      req.user.id,
      dueDate,
      maxScore || 100,
      attachments ? JSON.stringify(attachments) : null,
      isPublished ? 1 : 0
    );

    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid);
    const courseData = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(assignment.course_id);
    const teacher = db.prepare('SELECT name, email FROM users WHERE id = ?').get(assignment.teacher_id);

    res.status(201).json({
      success: true,
      data: {
        ...assignment,
        course: courseData,
        teacher
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private/Teacher/Admin
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (req.user.role !== 'admin' && assignment.teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, dueDate, maxScore, attachments, isPublished } = req.body;
    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (dueDate !== undefined) { updates.push('dueDate = ?'); values.push(dueDate); }
    if (maxScore !== undefined) { updates.push('maxScore = ?'); values.push(maxScore); }
    if (attachments !== undefined) { updates.push('attachments = ?'); values.push(JSON.stringify(attachments)); }
    if (isPublished !== undefined) { updates.push('isPublished = ?'); values.push(isPublished ? 1 : 0); }

    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE assignments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updatedAssignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    const course = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(updatedAssignment.course_id);
    const teacher = db.prepare('SELECT name, email FROM users WHERE id = ?').get(updatedAssignment.teacher_id);

    res.json({
      success: true,
      data: {
        ...updatedAssignment,
        course,
        teacher
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/assignments/:id/submit
// @desc    Submit assignment
// @access  Private/Student
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const db = getDB();
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if already submitted
    const existing = db.prepare(`
      SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?
    `).get(req.params.id, req.user.id);

    if (existing) {
      return res.status(400).json({ message: 'Assignment already submitted' });
    }

    // Check if late
    const isLate = new Date() > new Date(assignment.dueDate);

    const result = db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, content, attachments, isLate, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id,
      req.user.id,
      req.body.content || null,
      req.body.attachments ? JSON.stringify(req.body.attachments) : null,
      isLate ? 1 : 0,
      isLate ? 'late' : 'submitted'
    );

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(result.lastInsertRowid);
    const assignmentData = db.prepare('SELECT title, dueDate FROM assignments WHERE id = ?').get(req.params.id);
    const student = db.prepare('SELECT name, email FROM users WHERE id = ?').get(req.user.id);

    res.status(201).json({
      success: true,
      data: {
        ...submission,
        assignment: assignmentData,
        student
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
