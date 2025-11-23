import { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { FiCalendar, FiCheck, FiX, FiClock, FiPlus, FiEdit2 } from 'react-icons/fi';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    student: '',
    course: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    notes: ''
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAll();
      setAttendance(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await attendanceAPI.update(selectedRecord.id, formData);
      } else {
        await attendanceAPI.create(formData);
      }
      setShowModal(false);
      setSelectedRecord(null);
      setFormData({
        student: '',
        course: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        notes: ''
      });
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <FiCheck className="text-green-600" size={20} />;
      case 'absent':
        return <FiX className="text-red-600" size={20} />;
      case 'late':
        return <FiClock className="text-yellow-600" size={20} />;
      default:
        return <FiCalendar className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Attendance</h2>
          <p className="text-gray-600">Track and manage student attendance</p>
        </div>
        {(user.role === 'teacher' || user.role === 'admin') && (
          <button
            onClick={() => {
              setSelectedRecord(null);
              setFormData({
                student: '',
                course: '',
                date: new Date().toISOString().split('T')[0],
                status: 'present',
                notes: ''
              });
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" size={18} />
            Mark Attendance
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {attendance.map((record) => (
          <div key={record.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="p-3 bg-primary-100 rounded-lg">
                  {getStatusIcon(record.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {record.course?.name || 'Course'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                      {record.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {record.student && user.role !== 'student' && (
                      <p>
                        <span className="font-medium">Student:</span> {record.student.name}
                        {record.student.studentId && ` (${record.student.studentId})`}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                    {record.course && (
                      <p>
                        <span className="font-medium">Course:</span> {record.course.code}
                      </p>
                    )}
                    {record.markedBy && (
                      <p>
                        <span className="font-medium">Marked by:</span> {record.markedBy.name}
                      </p>
                    )}
                    {record.notes && (
                      <p className="mt-2 p-2 bg-gray-50 rounded">
                        <span className="font-medium">Notes:</span> {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {(user.role === 'teacher' || user.role === 'admin') && (
                <button
                  onClick={() => {
                    setSelectedRecord(record);
                    setFormData({
                      student: record.student_id,
                      course: record.course_id,
                      date: record.date,
                      status: record.status,
                      notes: record.notes || ''
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

      {attendance.length === 0 && (
        <div className="card text-center py-12">
          <FiCalendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No attendance records found</p>
        </div>
      )}

      {/* Create/Edit Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {selectedRecord ? 'Edit Attendance' : 'Mark Attendance'}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  {selectedRecord ? 'Update' : 'Mark'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRecord(null);
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

export default Attendance;

