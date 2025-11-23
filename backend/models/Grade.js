const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  },
  score: {
    type: Number,
    required: [true, 'Please add a score']
  },
  maxScore: {
    type: Number,
    required: true,
    default: 100
  },
  percentage: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F'],
    required: true
  },
  feedback: {
    type: String,
    trim: true
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gradedAt: {
    type: Date,
    default: Date.now
  },
  parentNotified: {
    type: Boolean,
    default: false
  }
});

// Calculate percentage and grade before saving
GradeSchema.pre('save', function(next) {
  this.percentage = (this.score / this.maxScore) * 100;
  
  if (this.percentage >= 90) this.grade = 'A';
  else if (this.percentage >= 80) this.grade = 'B';
  else if (this.percentage >= 70) this.grade = 'C';
  else if (this.percentage >= 60) this.grade = 'D';
  else this.grade = 'F';
  
  next();
});

module.exports = mongoose.model('Grade', GradeSchema);

