const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.phone = data.phone;
    this.studentId = data.studentId;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
  }

  static async findOne(query) {
    const db = getDB();
    let sql = 'SELECT * FROM users WHERE ';
    const conditions = [];
    const values = [];

    if (query.email) {
      conditions.push('email = ?');
      values.push(query.email.toLowerCase());
    }
    if (query.id) {
      conditions.push('id = ?');
      values.push(query.id);
    }
    if (query.studentId) {
      conditions.push('studentId = ?');
      values.push(query.studentId);
    }

    if (conditions.length === 0) return null;

    sql += conditions.join(' AND ');
    const row = db.prepare(sql).get(...values);
    return row ? new User(row) : null;
  }

  static async findById(id) {
    const db = getDB();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? new User(row) : null;
  }

  static async create(data) {
    const db = getDB();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (name, email, password, role, phone, studentId)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.name,
      data.email.toLowerCase(),
      hashedPassword,
      data.role || 'student',
      data.phone || null,
      data.studentId || null
    );

    return await User.findById(result.lastInsertRowid);
  }

  static async find(query = {}) {
    const db = getDB();
    let sql = 'SELECT * FROM users WHERE 1=1';
    const values = [];

    if (query.role) {
      sql += ' AND role = ?';
      values.push(query.role);
    }
    if (query.isActive !== undefined) {
      sql += ' AND isActive = ?';
      values.push(query.isActive ? 1 : 0);
    }

    const rows = db.prepare(sql).all(...values);
    return rows.map(row => new User(row));
  }

  async save() {
    const db = getDB();
    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, role = ?, phone = ?, studentId = ?, isActive = ?
      WHERE id = ?
    `).run(
      this.name,
      this.email,
      this.role,
      this.phone,
      this.studentId,
      this.isActive ? 1 : 0,
      this.id
    );
    return this;
  }

  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  getSignedJwtToken() {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
  }

  // Get children (for parents)
  getChildren() {
    const db = getDB();
    const rows = db.prepare(`
      SELECT u.* FROM users u
      INNER JOIN user_relationships ur ON u.id = ur.child_id
      WHERE ur.parent_id = ?
    `).all(this.id);
    return rows.map(row => new User(row));
  }

  // Get parent (for students)
  getParent() {
    const db = getDB();
    const row = db.prepare(`
      SELECT u.* FROM users u
      INNER JOIN user_relationships ur ON u.id = ur.parent_id
      WHERE ur.child_id = ?
    `).get(this.id);
    return row ? new User(row) : null;
  }

  // Link parent to child
  static async linkParent(childId, parentId) {
    const db = getDB();
    try {
      db.prepare(`
        INSERT INTO user_relationships (parent_id, child_id)
        VALUES (?, ?)
      `).run(parentId, childId);
      return true;
    } catch (error) {
      return false;
    }
  }

  toJSON() {
    const { password, ...user } = this;
    return user;
  }
}

module.exports = User;
