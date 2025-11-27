import { useState, useEffect } from 'react';
import { dashboardAPI, gradesAPI, attendanceAPI, assignmentsAPI } from '../services/api';
import {
  FiUsers,
  FiBook,
  FiAward,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';

const ParentsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardAPI.getData();
        setDashboardData(response.data.data);
        // Select first child by default if available
        if (response.data.data?.childrenData && response.data.data.childrenData.length > 0) {
          setSelectedChild(response.data.data.childrenData[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'primary', trend }) => (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center text-sm">
          {trend > 0 ? (
            <>
              <FiTrendingUp className="text-green-600 mr-1" size={16} />
              <span className="text-green-600">+{trend}%</span>
            </>
          ) : trend < 0 ? (
            <>
              <FiTrendingDown className="text-red-600 mr-1" size={16} />
              <span className="text-red-600">{trend}%</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );

  const childrenData = dashboardData.childrenData || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Parent Dashboard</h2>
        <p className="text-gray-600">Monitor your children's academic performance and attendance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiUsers}
          title="Children"
          value={dashboardData.children || 0}
          color="blue"
        />
        <StatCard
          icon={FiBook}
          title="Total Courses"
          value={dashboardData.courses || 0}
          color="purple"
        />
        <StatCard
          icon={FiAward}
          title="Avg Performance"
          value={
            childrenData.length > 0
              ? `${Math.round(childrenData.reduce((sum, c) => sum + (c.averageGrade || 0), 0) / childrenData.length)}%`
              : '0%'
          }
          color="green"
        />
        <StatCard
          icon={FiCalendar}
          title="Avg Attendance"
          value={
            childrenData.length > 0
              ? `${Math.round(childrenData.reduce((sum, c) => sum + (c.attendanceRate || 0), 0) / childrenData.length)}%`
              : '0%'
          }
          color="orange"
        />
      </div>

      {/* Children Selection */}
      {childrenData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Select Child to View Details</h3>
          <div className="flex flex-wrap gap-2">
            {childrenData.map((child) => (
              <button
                key={child.id || child.childId}
                onClick={() => setSelectedChild(child)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedChild?.id === child.id || selectedChild?.childId === child.childId
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {child.name || `Child ${child.id || child.childId}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Child Details */}
      {selectedChild && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedChild.name}</h3>
                <p className="text-sm text-gray-600">{selectedChild.email}</p>
                {selectedChild.studentId && (
                  <p className="text-xs text-gray-500">Student ID: {selectedChild.studentId}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600">{selectedChild.averageGrade || 0}%</p>
                <p className="text-sm text-gray-500">Average Grade</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Grades</p>
                <p className="text-2xl font-bold text-blue-600">{selectedChild.totalGrades || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-green-600">{selectedChild.attendanceRate || 0}%</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Courses Enrolled</p>
                <p className="text-2xl font-bold text-purple-600">{selectedChild.coursesCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Performance Alerts */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiAlertCircle className="mr-2 text-yellow-600" size={20} />
              Performance Alerts
            </h3>
            <div className="space-y-3">
              {selectedChild.averageGrade < 60 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <FiAlertCircle className="text-red-600 mr-2" size={18} />
                    <div>
                      <p className="font-medium text-red-800">Low Average Grade</p>
                      <p className="text-sm text-red-600">
                        Your child's average grade ({selectedChild.averageGrade}%) is below the passing threshold (60%).
                        Consider additional support.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FiCheckCircle className="text-green-600 mr-2" size={18} />
                    <div>
                      <p className="font-medium text-green-800">Good Performance</p>
                      <p className="text-sm text-green-600">
                        Your child is maintaining a good average grade of {selectedChild.averageGrade}%.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedChild.attendanceRate < 80 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <FiAlertCircle className="text-yellow-600 mr-2" size={18} />
                    <div>
                      <p className="font-medium text-yellow-800">Low Attendance Rate</p>
                      <p className="text-sm text-yellow-600">
                        Your child's attendance rate ({selectedChild.attendanceRate}%) is below the recommended
                        threshold (80%). Please ensure regular attendance.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FiCheckCircle className="text-green-600 mr-2" size={18} />
                    <div>
                      <p className="font-medium text-green-800">Good Attendance</p>
                      <p className="text-sm text-green-600">
                        Your child has a good attendance rate of {selectedChild.attendanceRate}%.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Grades</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedChild.recentGrades && selectedChild.recentGrades.length > 0 ? (
                  selectedChild.recentGrades.map((grade, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{grade.assignment?.title || grade.course?.name || 'Grade'}</p>
                        <p className="text-sm text-gray-600">{grade.course?.code || ''}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            grade.percentage >= 70 ? 'text-green-600' : grade.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}
                        >
                          {grade.percentage?.toFixed(1) || 0}%
                        </p>
                        <p className="text-sm text-gray-500">Grade: {grade.grade}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No grades recorded yet</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedChild.recentAttendance && selectedChild.recentAttendance.length > 0 ? (
                  selectedChild.recentAttendance.map((attendance, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{attendance.course?.name || 'Course'}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(attendance.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          attendance.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : attendance.status === 'late'
                            ? 'bg-yellow-100 text-yellow-800'
                            : attendance.status === 'excused'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {attendance.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No attendance records yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {childrenData.length === 0 && (
        <div className="card text-center py-12">
          <FiUsers className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No children linked to your account</p>
          <p className="text-sm text-gray-500 mt-2">Please contact the administrator to link your children's accounts.</p>
        </div>
      )}
    </div>
  );
};

export default ParentsDashboard;

