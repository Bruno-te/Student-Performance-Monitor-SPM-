import { useState, useEffect } from 'react';
import { gradesAPI } from '../services/api';
import { FiAward, FiTrendingUp, FiTrendingDown, FiPlus, FiEdit2 } from 'react-icons/fi';

const Grades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [formData, setFormData] = useState({
    student: '',
    course: '',
    assignment: '',
    score: '',
    maxScore: 100,
    feedback: ''
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await gradesAPI.getAll();
      setGrades(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedGrade) {
        await gradesAPI.update(selectedGrade.id, formData);
      } else {
        await gradesAPI.create(formData);
      }
      setShowModal(false);
      setSelectedGrade(null);
      setFormData({ student: '', course: '', assignment: '', score: '', maxScore: 100, feedback: '' });
      fetchGrades();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save grade');
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading grades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Grades</h2>
          <p className="text-gray-600">View and manage student grades</p>
        </div>
        {(user.role === 'teacher' || user.role === 'admin') && (
          <button
            onClick={() => {
              setSelectedGrade(null);
              setFormData({ student: '', course: '', assignment: '', score: '', maxScore: 100, feedback: '' });
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" size={18} />
            Add Grade
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {grades.map((grade) => (
          <div key={grade.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FiAward className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {grade.assignment?.title || grade.course?.name || 'Course Grade'}
                    </h3>
                    {grade.course && (
                      <p className="text-sm text-gray-600">
                        {grade.course.name} ({grade.course.code})
                      </p>
                    )}
                    {grade.student && user.role !== 'student' && (
                      <p className="text-sm text-gray-600">Student: {grade.student.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-800">
                      {grade.score}/{grade.maxScore}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.grade)}`}>
                      {grade.percentage.toFixed(1)}% - {grade.grade}
                    </span>
                  </div>
                  {grade.percentage >= 70 ? (
                    <FiTrendingUp className="text-green-600" size={20} />
                  ) : (
                    <FiTrendingDown className="text-red-600" size={20} />
                  )}
                </div>

                {grade.feedback && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Feedback:</span> {grade.feedback}
                    </p>
                  </div>
                )}

                {grade.gradedBy && (
                  <p className="text-xs text-gray-500 mt-2">
                    Graded by {grade.gradedBy.name} on {new Date(grade.gradedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {(user.role === 'teacher' || user.role === 'admin') && (
                <button
                  onClick={() => {
                    setSelectedGrade(grade);
                    setFormData({
                      student: grade.student_id,
                      course: grade.course_id,
                      assignment: grade.assignment_id || '',
                      score: grade.score,
                      maxScore: grade.maxScore,
                      feedback: grade.feedback || ''
                    });
                    setShowModal(true);
                  }}
                  className="btn btn-secondary text-sm ml-4"
                >
                  <FiEdit2 className="mr-1" size={14} />
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {grades.length === 0 && (
        <div className="card text-center py-12">
          <FiAward className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No grades found</p>
        </div>
      )}

      {/* Create/Edit Grade Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {selectedGrade ? 'Edit Grade' : 'Add New Grade'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <input
                    type="number"
                    value={formData.student}
                    onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course ID
                  </label>
                  <input
                    type="number"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment ID (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.assignment}
                    onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Score
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Score
                    </label>
                    <input
                      type="number"
                      value={formData.maxScore}
                      onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    className="input"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  {selectedGrade ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedGrade(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;

