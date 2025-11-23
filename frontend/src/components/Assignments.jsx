import { useState, useEffect } from 'react';
import { assignmentsAPI } from '../services/api';
import { FiFileText, FiCalendar, FiPlus, FiEdit2, FiUpload } from 'react-icons/fi';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    dueDate: '',
    maxScore: 100
  });
  const [submitData, setSubmitData] = useState({ content: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentsAPI.getAll();
      setAssignments(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAssignment) {
        await assignmentsAPI.update(selectedAssignment.id, formData);
      } else {
        await assignmentsAPI.create(formData);
      }
      setShowModal(false);
      setSelectedAssignment(null);
      setFormData({ title: '', description: '', course: '', dueDate: '', maxScore: 100 });
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assignment');
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    try {
      await assignmentsAPI.submit(selectedAssignment.id, submitData);
      setShowSubmitModal(false);
      setSubmitData({ content: '' });
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Assignments</h2>
          <p className="text-gray-600">View and manage assignments</p>
        </div>
        {(user.role === 'teacher' || user.role === 'admin') && (
          <button
            onClick={() => {
              setSelectedAssignment(null);
              setFormData({ title: '', description: '', course: '', dueDate: '', maxScore: 100 });
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" size={18} />
            Create Assignment
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FiFileText className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                    {assignment.course && (
                      <p className="text-sm text-gray-600">
                        {assignment.course.name} ({assignment.course.code})
                      </p>
                    )}
                  </div>
                </div>

                {assignment.description && (
                  <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FiCalendar className="mr-2" size={16} />
                    <span>
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    {isOverdue(assignment.dueDate) && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                  <span>Max Score: {assignment.maxScore}</span>
                  {assignment.teacher && (
                    <span>Teacher: {assignment.teacher.name}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                {user.role === 'student' && (
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setSubmitData({ content: '' });
                      setShowSubmitModal(true);
                    }}
                    className="btn btn-primary text-sm"
                  >
                    <FiUpload className="mr-1" size={14} />
                    Submit
                  </button>
                )}
                {(user.role === 'teacher' || user.role === 'admin') && (
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setFormData({
                        title: assignment.title,
                        description: assignment.description || '',
                        course: assignment.course_id,
                        dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
                        maxScore: assignment.maxScore
                      });
                      setShowModal(true);
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    <FiEdit2 className="mr-1" size={14} />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="card text-center py-12">
          <FiFileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No assignments found</p>
        </div>
      )}

      {/* Create/Edit Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {selectedAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="4"
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
                    placeholder="Enter course ID"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  {selectedAssignment ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAssignment(null);
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

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Submit Assignment: {selectedAssignment.title}</h3>
            <form onSubmit={handleSubmitAssignment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Submission
                </label>
                <textarea
                  value={submitData.content}
                  onChange={(e) => setSubmitData({ ...submitData, content: e.target.value })}
                  className="input"
                  rows="6"
                  required
                  placeholder="Enter your assignment submission..."
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Submit Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
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

export default Assignments;

