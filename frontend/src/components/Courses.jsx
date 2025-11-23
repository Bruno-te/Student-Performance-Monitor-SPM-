import { useState, useEffect } from 'react';
import { coursesAPI } from '../services/api';
import { FiBook, FiUsers, FiPlus, FiEdit2, FiUserPlus } from 'react-icons/fi';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll();
      setCourses(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCourse) {
        await coursesAPI.update(selectedCourse.id, formData);
      } else {
        await coursesAPI.create(formData);
      }
      setShowModal(false);
      setSelectedCourse(null);
      setFormData({ name: '', code: '', description: '', startDate: '', endDate: '' });
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await coursesAPI.addStudent(selectedCourse.id, formData.studentId);
      setShowAddStudentModal(false);
      setFormData({ ...formData, studentId: '' });
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Courses</h2>
          <p className="text-gray-600">Manage and view all courses</p>
        </div>
        {(user.role === 'teacher' || user.role === 'admin') && (
          <button
            onClick={() => {
              setSelectedCourse(null);
              setFormData({ name: '', code: '', description: '', startDate: '', endDate: '' });
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" size={18} />
            Create Course
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <FiBook className="text-primary-600" size={24} />
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                {course.code}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.name}</h3>
            {course.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <FiUsers className="mr-2" size={16} />
                <span>{course.students?.length || 0} students</span>
              </div>
              {course.teacher && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Teacher:</span> {course.teacher.name}
                </div>
              )}
            </div>

            {(user.role === 'teacher' || user.role === 'admin') && (
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedCourse(course);
                    setFormData({
                      name: course.name,
                      code: course.code,
                      description: course.description || '',
                      startDate: course.startDate ? course.startDate.split('T')[0] : '',
                      endDate: course.endDate ? course.endDate.split('T')[0] : ''
                    });
                    setShowModal(true);
                  }}
                  className="btn btn-secondary text-sm flex-1"
                >
                  <FiEdit2 className="mr-1" size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedCourse(course);
                    setFormData({ studentId: '' });
                    setShowAddStudentModal(true);
                  }}
                  className="btn btn-primary text-sm flex-1"
                >
                  <FiUserPlus className="mr-1" size={14} />
                  Add Student
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="card text-center py-12">
          <FiBook className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No courses found</p>
          {(user.role === 'teacher' || user.role === 'admin') && (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary mt-4"
            >
              Create Your First Course
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {selectedCourse ? 'Edit Course' : 'Create New Course'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
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
                    rows="3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  {selectedCourse ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCourse(null);
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

      {/* Add Student Modal */}
      {showAddStudentModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Student to {selectedCourse.name}</h3>
            <form onSubmit={handleAddStudent}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID
                </label>
                <input
                  type="number"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="input"
                  required
                  placeholder="Enter student user ID"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Add Student
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
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

export default Courses;

