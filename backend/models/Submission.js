const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  attachments: [{
    type: String
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['submitted', 'late', 'graded'],
    default: 'submitted'
  },
  isLate: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);

