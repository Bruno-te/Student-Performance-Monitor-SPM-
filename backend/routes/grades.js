const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDB } = require('../config/database');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to send parent alert
const sendParentAlert = async (grade, student, parent) => {
  try {
    if (!parent || !parent.email) return;

    const subject = `Grade Alert: ${student.name} - ${grade.assignment_id ? 'Assignment' : 'Course'} Grade`;
    const html = `
      <h2>Grade Alert</h2>
      <p>Dear ${parent.name},</p>
      <p>Your child <strong>${student.name}</strong> has received a new grade:</p>
      <ul>
        <li><strong>Score:</strong> ${grade.score}/${grade.maxScore} (${grade.percentage.toFixed(1)}%)</li>
        <li><strong>Grade:</strong> ${grade.grade}</li>
        ${grade.feedback ? `<li><strong>Feedback:</strong> ${grade.feedback}</li>` : ''}
      </ul>
      <p>Please log in to the EduBridge Africa platform to view more details.</p>
      <p>Best regards,<br>EduBridge Africa Team</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: parent.email,
      subject,
      html
    });

    const db = getDB();
    db.prepare('UPDATE grades SET parentNotified = 1 WHERE id = ?').run(grade.id);
  } catch (error) {
    console.error('Error sending parent alert:', error);
  }
};

// @route   GET /api/grades
// @desc    Get all grades
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const db = getDB();
    let grades;

    if (req.user.role === 'student') {
      grades = db.prepare('SELECT * FROM grades WHERE student_id = ? ORDER BY gradedAt DESC').all(req.user.id);
    } else if (req.user.role === 'parent') {
      const children = db.prepare(`
        SELECT child_id FROM user_relationships WHERE parent_id = ?
      `).all(req.user.id);
      const childrenIds = children.map(c => c.child_id);

      if (childrenIds.length > 0) {
        grades = db.prepare(`
          SELECT * FROM grades WHERE student_id IN (${childrenIds.map(() => '?').join(',')})
          ORDER BY gradedAt DESC
        `).all(...childrenIds);
      } else {
        grades = [];
      }
    } else if (req.user.role === 'teacher') {
      grades = db.prepare('SELECT * FROM grades WHERE gradedBy_id = ? ORDER BY gradedAt DESC').all(req.user.id);
    } else {
      grades = db.prepare('SELECT * FROM grades ORDER BY gradedAt DESC').all();
    }

    // Populate related data
    grades = grades.map(grade => {
      const student = db.prepare('SELECT id, name, email, studentId FROM users WHERE id = ?').get(grade.student_id);
      const course = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(grade.course_id);
      const assignment = grade.assignment_id ? db.prepare('SELECT title FROM assignments WHERE id = ?').get(grade.assignment_id) : null;
      const gradedBy = db.prepare('SELECT name FROM users WHERE id = ?').get(grade.gradedBy_id);

      return {
        ...grade,
        student,
        course,
        assignment,
        gradedBy: { name: gradedBy.name }
      };
    });

    res.json({ success: true, count: grades.length, data: grades });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/grades/:id
// @desc    Get single grade
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const db = getDB();
    const grade = db.prepare('SELECT * FROM grades WHERE id = ?').get(req.params.id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && grade.student_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const student = db.prepare('SELECT id, name, email, studentId FROM users WHERE id = ?').get(grade.student_id);
    const course = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(grade.course_id);
    const assignment = grade.assignment_id ? db.prepare('SELECT title FROM assignments WHERE id = ?').get(grade.assignment_id) : null;
    const gradedBy = db.prepare('SELECT name FROM users WHERE id = ?').get(grade.gradedBy_id);

    res.json({
      success: true,
      data: {
        ...grade,
        student,
        course,
        assignment,
        gradedBy: { name: gradedBy.name }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/grades
// @desc    Create new grade
// @access  Private/Teacher/Admin
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const { student, course, assignment, submission, score, maxScore, feedback } = req.body;

    const percentage = (score / maxScore) * 100;
    let grade;
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    else grade = 'F';

    const result = db.prepare(`
      INSERT INTO grades (student_id, course_id, assignment_id, submission_id, score, maxScore, percentage, grade, feedback, gradedBy_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      student,
      course,
      assignment || null,
      submission || null,
      score,
      maxScore || 100,
      percentage,
      grade,
      feedback || null,
      req.user.id
    );

    const newGrade = db.prepare('SELECT * FROM grades WHERE id = ?').get(result.lastInsertRowid);
    
    // Populate data
    const studentData = db.prepare('SELECT * FROM users WHERE id = ?').get(newGrade.student_id);
    const courseData = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(newGrade.course_id);
    const assignmentData = newGrade.assignment_id ? db.prepare('SELECT title FROM assignments WHERE id = ?').get(newGrade.assignment_id) : null;
    const gradedBy = db.prepare('SELECT name FROM users WHERE id = ?').get(newGrade.gradedBy_id);

    // Send parent alert if grade is low (below 60%)
    if (percentage < 60) {
      const parent = db.prepare(`
        SELECT u.* FROM users u
        INNER JOIN user_relationships ur ON u.id = ur.parent_id
        WHERE ur.child_id = ?
      `).get(student);
      
      if (parent) {
        await sendParentAlert(newGrade, studentData, parent);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...newGrade,
        student: studentData,
        course: courseData,
        assignment: assignmentData,
        gradedBy: { name: gradedBy.name }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/grades/:id
// @desc    Update grade
// @access  Private/Teacher/Admin
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const grade = db.prepare('SELECT * FROM grades WHERE id = ?').get(req.params.id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    if (req.user.role !== 'admin' && grade.gradedBy_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { score, maxScore, feedback } = req.body;
    const updates = [];
    const values = [];

    if (score !== undefined || maxScore !== undefined) {
      const newScore = score !== undefined ? score : grade.score;
      const newMaxScore = maxScore !== undefined ? maxScore : grade.maxScore;
      const percentage = (newScore / newMaxScore) * 100;
      let gradeLetter;
      if (percentage >= 90) gradeLetter = 'A';
      else if (percentage >= 80) gradeLetter = 'B';
      else if (percentage >= 70) gradeLetter = 'C';
      else if (percentage >= 60) gradeLetter = 'D';
      else gradeLetter = 'F';

      updates.push('score = ?', 'maxScore = ?', 'percentage = ?', 'grade = ?');
      values.push(newScore, newMaxScore, percentage, gradeLetter);
    }
    if (feedback !== undefined) { updates.push('feedback = ?'); values.push(feedback); }

    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE grades SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updatedGrade = db.prepare('SELECT * FROM grades WHERE id = ?').get(req.params.id);
    const student = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(updatedGrade.student_id);
    const course = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(updatedGrade.course_id);
    const assignment = updatedGrade.assignment_id ? db.prepare('SELECT title FROM assignments WHERE id = ?').get(updatedGrade.assignment_id) : null;

    res.json({
      success: true,
      data: {
        ...updatedGrade,
        student,
        course,
        assignment
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/grades/student/:studentId
// @desc    Get grades for a specific student
// @access  Private
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const db = getDB();
    
    // Check authorization
    if (req.user.role === 'student' && req.user.id !== parseInt(req.params.studentId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'parent') {
      const children = db.prepare(`
        SELECT child_id FROM user_relationships WHERE parent_id = ?
      `).all(req.user.id);
      const childrenIds = children.map(c => c.child_id.toString());
      
      if (!childrenIds.includes(req.params.studentId)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const grades = db.prepare(`
      SELECT * FROM grades WHERE student_id = ? ORDER BY gradedAt DESC
    `).all(req.params.studentId);

    // Populate related data
    const gradesWithData = grades.map(grade => {
      const course = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(grade.course_id);
      const assignment = grade.assignment_id ? db.prepare('SELECT title FROM assignments WHERE id = ?').get(grade.assignment_id) : null;
      const gradedBy = db.prepare('SELECT name FROM users WHERE id = ?').get(grade.gradedBy_id);

      return {
        ...grade,
        course,
        assignment,
        gradedBy: { name: gradedBy.name }
      };
    });

    res.json({ success: true, count: gradesWithData.length, data: gradesWithData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
