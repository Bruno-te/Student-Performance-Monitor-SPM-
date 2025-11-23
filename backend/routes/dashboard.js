const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDB } = require('../config/database');

// @route   GET /api/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const db = getDB();
    let dashboardData = {};

    if (req.user.role === 'student') {
      // Student dashboard
      const courses = db.prepare(`
        SELECT COUNT(*) as count FROM courses c
        INNER JOIN course_students cs ON c.id = cs.course_id
        WHERE cs.student_id = ? AND c.isActive = 1
      `).get(req.user.id);

      const grades = db.prepare('SELECT * FROM grades WHERE student_id = ?').all(req.user.id);
      const attendance = db.prepare('SELECT * FROM attendance WHERE student_id = ?').all(req.user.id);
      
      const assignments = db.prepare(`
        SELECT COUNT(*) as count FROM assignments a
        INNER JOIN courses c ON a.course_id = c.id
        INNER JOIN course_students cs ON c.id = cs.course_id
        WHERE cs.student_id = ? AND a.isPublished = 1
      `).get(req.user.id);

      const unreadMessages = db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE recipient_id = ? AND isRead = 0
      `).get(req.user.id);

      // Calculate average grade
      const avgGrade = grades.length > 0
        ? grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length
        : 0;

      // Calculate attendance rate
      const totalAttendance = attendance.length;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      dashboardData = {
        courses: courses.count || 0,
        assignments: assignments.count || 0,
        grades: grades.length,
        averageGrade: avgGrade.toFixed(1),
        attendanceRate: attendanceRate.toFixed(1),
        unreadMessages: unreadMessages.count || 0,
        recentGrades: grades.slice(0, 5).map(g => ({
          ...g,
          course: db.prepare('SELECT name, code FROM courses WHERE id = ?').get(g.course_id),
          assignment: g.assignment_id ? db.prepare('SELECT title FROM assignments WHERE id = ?').get(g.assignment_id) : null
        })),
        recentAttendance: attendance.slice(0, 5).map(a => ({
          ...a,
          course: db.prepare('SELECT name, code FROM courses WHERE id = ?').get(a.course_id)
        }))
      };
    } else if (req.user.role === 'parent') {
      // Parent dashboard
      const children = db.prepare(`
        SELECT child_id FROM user_relationships WHERE parent_id = ?
      `).all(req.user.id);

      const childrenIds = children.map(c => c.child_id);

      let courses, assignments, grades;
      if (childrenIds.length > 0) {
        courses = db.prepare(`
          SELECT COUNT(DISTINCT c.id) as count FROM courses c
          INNER JOIN course_students cs ON c.id = cs.course_id
          WHERE cs.student_id IN (${childrenIds.map(() => '?').join(',')}) AND c.isActive = 1
        `).get(...childrenIds);

        assignments = db.prepare(`
          SELECT COUNT(DISTINCT a.id) as count FROM assignments a
          INNER JOIN courses c ON a.course_id = c.id
          INNER JOIN course_students cs ON c.id = cs.course_id
          WHERE cs.student_id IN (${childrenIds.map(() => '?').join(',')}) AND a.isPublished = 1
        `).get(...childrenIds);

        grades = db.prepare(`
          SELECT * FROM grades WHERE student_id IN (${childrenIds.map(() => '?').join(',')})
        `).all(...childrenIds);
      } else {
        courses = { count: 0 };
        assignments = { count: 0 };
        grades = [];
      }

      const unreadMessages = db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE recipient_id = ? AND isRead = 0
      `).get(req.user.id);

      const childrenData = childrenIds.map((childId) => {
        const child = db.prepare('SELECT id, name, email, studentId FROM users WHERE id = ?').get(childId);
        const childGrades = db.prepare('SELECT * FROM grades WHERE student_id = ?').all(childId);
        const childAttendance = db.prepare('SELECT * FROM attendance WHERE student_id = ?').all(childId);
        const avgGrade = childGrades.length > 0
          ? childGrades.reduce((sum, g) => sum + g.percentage, 0) / childGrades.length
          : 0;
        const presentCount = childAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = childAttendance.length > 0
          ? (presentCount / childAttendance.length) * 100
          : 0;

        return {
          childId,
          name: child?.name || 'Unknown',
          email: child?.email || '',
          studentId: child?.studentId || '',
          averageGrade: avgGrade.toFixed(1),
          attendanceRate: attendanceRate.toFixed(1),
          totalGrades: childGrades.length
        };
      });

      dashboardData = {
        children: childrenIds.length,
        courses: courses.count || 0,
        assignments: assignments.count || 0,
        totalGrades: grades.length,
        unreadMessages: unreadMessages.count || 0,
        childrenData,
        recentGrades: grades.slice(0, 5).map(g => ({
          ...g,
          student: db.prepare('SELECT name, email, studentId FROM users WHERE id = ?').get(g.student_id),
          course: db.prepare('SELECT name, code FROM courses WHERE id = ?').get(g.course_id),
          assignment: g.assignment_id ? db.prepare('SELECT title FROM assignments WHERE id = ?').get(g.assignment_id) : null
        })),
        recentAttendance: (childrenIds.length > 0 ? db.prepare(`
          SELECT * FROM attendance 
          WHERE student_id IN (${childrenIds.map(() => '?').join(',')})
          ORDER BY date DESC LIMIT 5
        `).all(...childrenIds) : []).map(a => ({
          ...a,
          student: db.prepare('SELECT name, email, studentId FROM users WHERE id = ?').get(a.student_id),
          course: db.prepare('SELECT name, code FROM courses WHERE id = ?').get(a.course_id)
        }))
      };
    } else if (req.user.role === 'teacher') {
      // Teacher dashboard
      const courses = db.prepare('SELECT COUNT(*) as count FROM courses WHERE teacher_id = ?').get(req.user.id);
      const assignments = db.prepare('SELECT COUNT(*) as count FROM assignments WHERE teacher_id = ?').get(req.user.id);
      const grades = db.prepare('SELECT COUNT(*) as count FROM grades WHERE gradedBy_id = ?').get(req.user.id);
      const attendance = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE markedBy_id = ?').get(req.user.id);
      
      // Count unique students
      const students = db.prepare(`
        SELECT COUNT(DISTINCT cs.student_id) as count FROM course_students cs
        INNER JOIN courses c ON cs.course_id = c.id
        WHERE c.teacher_id = ?
      `).get(req.user.id);

      const unreadMessages = db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE recipient_id = ? AND isRead = 0
      `).get(req.user.id);

      // Get list of students
      const studentList = db.prepare(`
        SELECT DISTINCT u.id, u.name, u.email, u.studentId, u.phone
        FROM users u
        INNER JOIN course_students cs ON u.id = cs.student_id
        INNER JOIN courses c ON cs.course_id = c.id
        WHERE c.teacher_id = ?
        ORDER BY u.name
      `).all(req.user.id);

      dashboardData = {
        courses: courses.count || 0,
        students: students.count || 0,
        assignments: assignments.count || 0,
        grades: grades.count || 0,
        attendance: attendance.count || 0,
        unreadMessages: unreadMessages.count || 0,
        studentList: studentList,
        recentGrades: db.prepare(`
          SELECT * FROM grades WHERE gradedBy_id = ? ORDER BY gradedAt DESC LIMIT 5
        `).all(req.user.id).map(g => ({
          ...g,
          student: db.prepare('SELECT name, email, studentId FROM users WHERE id = ?').get(g.student_id),
          course: db.prepare('SELECT name, code FROM courses WHERE id = ?').get(g.course_id),
          assignment: g.assignment_id ? db.prepare('SELECT title FROM assignments WHERE id = ?').get(g.assignment_id) : null
        })),
        recentAttendance: db.prepare(`
          SELECT * FROM attendance WHERE markedBy_id = ? ORDER BY date DESC LIMIT 5
        `).all(req.user.id).map(a => ({
          ...a,
          student: db.prepare('SELECT name, email, studentId FROM users WHERE id = ?').get(a.student_id),
          course: db.prepare('SELECT name, code FROM courses WHERE id = ?').get(a.course_id)
        }))
      };
    } else {
      // Admin dashboard
      const courses = db.prepare('SELECT COUNT(*) as count FROM courses').get();
      const assignments = db.prepare('SELECT COUNT(*) as count FROM assignments').get();
      const grades = db.prepare('SELECT COUNT(*) as count FROM grades').get();
      const attendance = db.prepare('SELECT COUNT(*) as count FROM attendance').get();
      const students = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('student');
      const teachers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('teacher');
      const parents = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('parent');
      const unreadMessages = db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE recipient_id = ? AND isRead = 0
      `).get(req.user.id);

      // Get list of all students
      const studentList = db.prepare(`
        SELECT id, name, email, studentId, phone, createdAt
        FROM users
        WHERE role = 'student'
        ORDER BY name
      `).all();

      dashboardData = {
        courses: courses.count || 0,
        assignments: assignments.count || 0,
        grades: grades.count || 0,
        attendance: attendance.count || 0,
        students: students.count || 0,
        teachers: teachers.count || 0,
        parents: parents.count || 0,
        unreadMessages: unreadMessages.count || 0,
        studentList: studentList
      };
    }

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: error.message || 'Failed to load dashboard data' });
  }
});

module.exports = router;
