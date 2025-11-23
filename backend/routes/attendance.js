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

// Helper function to send parent alert for attendance
const sendAttendanceAlert = async (attendance, student, parent) => {
  try {
    if (!parent || !parent.email || attendance.status === 'present') return;

    const subject = `Attendance Alert: ${student.name} - ${attendance.status.toUpperCase()}`;
    const html = `
      <h2>Attendance Alert</h2>
      <p>Dear ${parent.name},</p>
      <p>Your child <strong>${student.name}</strong> was marked as <strong>${attendance.status.toUpperCase()}</strong> on ${new Date(attendance.date).toLocaleDateString()}.</p>
      ${attendance.notes ? `<p><strong>Notes:</strong> ${attendance.notes}</p>` : ''}
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
    db.prepare('UPDATE attendance SET parentNotified = 1 WHERE id = ?').run(attendance.id);
  } catch (error) {
    console.error('Error sending attendance alert:', error);
  }
};

// @route   GET /api/attendance
// @desc    Get all attendance records
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const db = getDB();
    let attendance;

    if (req.user.role === 'student') {
      attendance = db.prepare('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC').all(req.user.id);
    } else if (req.user.role === 'parent') {
      const children = db.prepare(`
        SELECT child_id FROM user_relationships WHERE parent_id = ?
      `).all(req.user.id);
      const childrenIds = children.map(c => c.child_id);

      if (childrenIds.length > 0) {
        attendance = db.prepare(`
          SELECT * FROM attendance 
          WHERE student_id IN (${childrenIds.map(() => '?').join(',')})
          ORDER BY date DESC
        `).all(...childrenIds);
      } else {
        attendance = [];
      }
    } else if (req.user.role === 'teacher') {
      attendance = db.prepare('SELECT * FROM attendance WHERE markedBy_id = ? ORDER BY date DESC').all(req.user.id);
    } else {
      attendance = db.prepare('SELECT * FROM attendance ORDER BY date DESC').all();
    }

    // Populate related data
    attendance = attendance.map(att => {
      const student = db.prepare('SELECT id, name, email, studentId FROM users WHERE id = ?').get(att.student_id);
      const course = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(att.course_id);
      const markedBy = db.prepare('SELECT name FROM users WHERE id = ?').get(att.markedBy_id);

      return {
        ...att,
        student,
        course,
        markedBy: { name: markedBy.name }
      };
    });

    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance for a specific student
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

    const attendance = db.prepare(`
      SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC
    `).all(req.params.studentId);

    // Populate related data
    const attendanceWithData = attendance.map(att => {
      const course = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(att.course_id);
      const markedBy = db.prepare('SELECT name FROM users WHERE id = ?').get(att.markedBy_id);

      return {
        ...att,
        course,
        markedBy: { name: markedBy.name }
      };
    });

    res.json({ success: true, count: attendanceWithData.length, data: attendanceWithData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/attendance
// @desc    Create new attendance record
// @access  Private/Teacher/Admin
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const { student, course, date, status, notes } = req.body;

    const result = db.prepare(`
      INSERT INTO attendance (student_id, course_id, date, status, markedBy_id, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      student,
      course,
      date || new Date().toISOString().split('T')[0],
      status || 'absent',
      req.user.id,
      notes || null
    );

    const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(result.lastInsertRowid);
    
    // Populate data
    const studentData = db.prepare('SELECT * FROM users WHERE id = ?').get(attendance.student_id);
    const courseData = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(attendance.course_id);
    const markedBy = db.prepare('SELECT name FROM users WHERE id = ?').get(attendance.markedBy_id);

    // Send parent alert if absent or late
    if (attendance.status === 'absent' || attendance.status === 'late') {
      const parent = db.prepare(`
        SELECT u.* FROM users u
        INNER JOIN user_relationships ur ON u.id = ur.parent_id
        WHERE ur.child_id = ?
      `).get(student);
      
      if (parent) {
        await sendAttendanceAlert(attendance, studentData, parent);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...attendance,
        student: studentData,
        course: courseData,
        markedBy: { name: markedBy.name }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private/Teacher/Admin
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const attendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (req.user.role !== 'admin' && attendance.markedBy_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { date, status, notes } = req.body;
    const updates = [];
    const values = [];

    if (date !== undefined) { updates.push('date = ?'); values.push(date); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE attendance SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updatedAttendance = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id);
    const student = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(updatedAttendance.student_id);
    const course = db.prepare('SELECT name, code FROM courses WHERE id = ?').get(updatedAttendance.course_id);

    res.json({
      success: true,
      data: {
        ...updatedAttendance,
        student,
        course
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
