import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  FiBook,
  FiFileText,
  FiAward,
  FiCalendar,
  FiMessageSquare,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardAPI.getData();
        setDashboardData(response.data.data);
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

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'primary' }) => (
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
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back, {user.name}!</h2>
        <p className="text-gray-600">Here's an overview of your performance and activities.</p>
      </div>

      {user.role === 'student' && dashboardData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FiBook}
              title="Courses"
              value={dashboardData.courses}
              color="blue"
            />
            <StatCard
              icon={FiFileText}
              title="Assignments"
              value={dashboardData.assignments}
              color="purple"
            />
            <StatCard
              icon={FiAward}
              title="Average Grade"
              value={`${dashboardData.averageGrade}%`}
              subtitle={`${dashboardData.grades} grades recorded`}
              color="green"
            />
            <StatCard
              icon={FiCalendar}
              title="Attendance"
              value={`${dashboardData.attendanceRate}%`}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Grades</h3>
              <div className="space-y-3">
                {dashboardData.recentGrades?.length > 0 ? (
                  dashboardData.recentGrades.map((grade, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{grade.assignment?.title || grade.course?.name}</p>
                        <p className="text-sm text-gray-600">{grade.course?.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-600">{grade.percentage.toFixed(1)}%</p>
                        <p className="text-sm text-gray-500">Grade: {grade.grade}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No grades yet</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
              <div className="space-y-3">
                {dashboardData.recentAttendance?.length > 0 ? (
                  dashboardData.recentAttendance.map((attendance, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{attendance.course?.name}</p>
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

      {user.role === 'parent' && dashboardData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FiUsers}
              title="Children"
              value={dashboardData.children}
              color="blue"
            />
            <StatCard
              icon={FiBook}
              title="Courses"
              value={dashboardData.courses}
              color="purple"
            />
            <StatCard
              icon={FiFileText}
              title="Assignments"
              value={dashboardData.assignments}
              color="orange"
            />
            <StatCard
              icon={FiMessageSquare}
              title="Unread Messages"
              value={dashboardData.unreadMessages}
              color="red"
            />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Children Performance</h3>
            <div className="space-y-4">
              {dashboardData.childrenData?.map((child, idx) => (
                <div key={child.childId || idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{child.name || `Child ${idx + 1}`}</p>
                      <p className="text-sm text-gray-600">{child.email}</p>
                      {child.studentId && (
                        <p className="text-xs text-gray-500">ID: {child.studentId}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">{child.totalGrades} grades recorded</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">{child.averageGrade}%</p>
                      <p className="text-sm text-gray-500">Avg Grade</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Attendance Rate: <span className="font-medium">{child.attendanceRate}%</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {user.role === 'teacher' && dashboardData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FiBook}
              title="Courses"
              value={dashboardData.courses}
              color="blue"
            />
            <StatCard
              icon={FiUsers}
              title="Students"
              value={dashboardData.students}
              color="green"
            />
            <StatCard
              icon={FiFileText}
              title="Assignments"
              value={dashboardData.assignments}
              color="purple"
            />
            <StatCard
              icon={FiAward}
              title="Grades Given"
              value={dashboardData.grades}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">My Students</h3>
              <div className="space-y-3">
                {dashboardData.studentList && dashboardData.studentList.length > 0 ? (
                  dashboardData.studentList.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        {student.studentId && (
                          <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No students enrolled in your courses yet</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Grades</h3>
              <div className="space-y-3">
                {dashboardData.recentGrades && dashboardData.recentGrades.length > 0 ? (
                  dashboardData.recentGrades.map((grade, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{grade.student?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{grade.course?.name || grade.assignment?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-600">{grade.percentage?.toFixed(1) || 0}%</p>
                        <p className="text-sm text-gray-500">Grade: {grade.grade}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No grades recorded yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {user.role === 'admin' && dashboardData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FiBook}
              title="Total Courses"
              value={dashboardData.courses}
              color="blue"
            />
            <StatCard
              icon={FiUsers}
              title="Students"
              value={dashboardData.students}
              color="green"
            />
            <StatCard
              icon={FiFileText}
              title="Assignments"
              value={dashboardData.assignments}
              color="purple"
            />
            <StatCard
              icon={FiAward}
              title="Grades"
              value={dashboardData.grades}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">All Students</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.studentList && dashboardData.studentList.length > 0 ? (
                  dashboardData.studentList.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        {student.studentId && (
                          <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No students registered yet</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">System Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Teachers</p>
                    <p className="text-sm text-gray-600">Total registered teachers</p>
                  </div>
                  <p className="text-2xl font-bold text-primary-600">{dashboardData.teachers || 0}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Parents</p>
                    <p className="text-sm text-gray-600">Total registered parents</p>
                  </div>
                  <p className="text-2xl font-bold text-primary-600">{dashboardData.parents || 0}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Attendance Records</p>
                    <p className="text-sm text-gray-600">Total attendance entries</p>
                  </div>
                  <p className="text-2xl font-bold text-primary-600">{dashboardData.attendance || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

