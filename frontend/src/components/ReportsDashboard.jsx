import { useState, useEffect } from 'react';
import { dashboardAPI, gradesAPI, attendanceAPI, coursesAPI, assignmentsAPI } from '../services/api';
import {
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiBook,
  FiUsers,
  FiAward,
  FiFileText,
} from 'react-icons/fi';

const ReportsDashboard = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    period: 'all', // all, week, month, semester
    course: 'all',
  });
  const [courses, setCourses] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, coursesRes] = await Promise.all([
          dashboardAPI.getData(),
          coursesAPI.getAll(),
        ]);
        setReportsData(dashboardRes.data.data);
        setCourses(coursesRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
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

  const getGradeDistribution = () => {
    if (!reportsData) return { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    // This would need to be fetched from the API
    // For now, return placeholder data
    return { A: 0, B: 0, C: 0, D: 0, F: 0 };
  };

  const gradeDistribution = getGradeDistribution();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn btn-secondary flex items-center">
            <FiDownload className="mr-2" size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-600" size={18} />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div>
            <label className="text-sm text-gray-600 mr-2">Period:</label>
            <select
              value={filter.period}
              onChange={(e) => setFilter({ ...filter, period: e.target.value })}
              className="input text-sm"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
            </select>
          </div>
          {(user.role === 'teacher' || user.role === 'admin') && (
            <div>
              <label className="text-sm text-gray-600 mr-2">Course:</label>
              <select
                value={filter.course}
                onChange={(e) => setFilter({ ...filter, course: e.target.value })}
                className="input text-sm"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role === 'student' && reportsData && (
          <>
            <StatCard
              icon={FiBook}
              title="Courses"
              value={reportsData.courses || 0}
              color="blue"
            />
            <StatCard
              icon={FiAward}
              title="Average Grade"
              value={`${reportsData.averageGrade || 0}%`}
              subtitle={`${reportsData.grades || 0} grades`}
              color="green"
            />
            <StatCard
              icon={FiCalendar}
              title="Attendance"
              value={`${reportsData.attendanceRate || 0}%`}
              color="orange"
            />
            <StatCard
              icon={FiBarChart2}
              title="Performance"
              value={reportsData.averageGrade >= 70 ? 'Good' : reportsData.averageGrade >= 60 ? 'Fair' : 'Needs Improvement'}
              color={reportsData.averageGrade >= 70 ? 'green' : reportsData.averageGrade >= 60 ? 'yellow' : 'red'}
            />
          </>
        )}

        {user.role === 'teacher' && reportsData && (
          <>
            <StatCard
              icon={FiBook}
              title="Courses"
              value={reportsData.courses || 0}
              color="blue"
            />
            <StatCard
              icon={FiUsers}
              title="Students"
              value={reportsData.students || 0}
              color="green"
            />
            <StatCard
              icon={FiFileText}
              title="Assignments"
              value={reportsData.assignments || 0}
              color="purple"
            />
            <StatCard
              icon={FiAward}
              title="Grades Given"
              value={reportsData.grades || 0}
              color="orange"
            />
          </>
        )}

        {user.role === 'parent' && reportsData && (
          <>
            <StatCard
              icon={FiUsers}
              title="Children"
              value={reportsData.children || 0}
              color="blue"
            />
            <StatCard
              icon={FiBook}
              title="Total Courses"
              value={reportsData.courses || 0}
              color="purple"
            />
            <StatCard
              icon={FiAward}
              title="Avg Performance"
              value={
                reportsData.childrenData && reportsData.childrenData.length > 0
                  ? `${Math.round(
                      reportsData.childrenData.reduce((sum, c) => sum + (c.averageGrade || 0), 0) /
                        reportsData.childrenData.length
                    )}%`
                  : '0%'
              }
              color="green"
            />
            <StatCard
              icon={FiCalendar}
              title="Avg Attendance"
              value={
                reportsData.childrenData && reportsData.childrenData.length > 0
                  ? `${Math.round(
                      reportsData.childrenData.reduce((sum, c) => sum + (c.attendanceRate || 0), 0) /
                        reportsData.childrenData.length
                    )}%`
                  : '0%'
              }
              color="orange"
            />
          </>
        )}

        {user.role === 'admin' && reportsData && (
          <>
            <StatCard
              icon={FiBook}
              title="Total Courses"
              value={reportsData.courses || 0}
              color="blue"
            />
            <StatCard
              icon={FiUsers}
              title="Students"
              value={reportsData.students || 0}
              color="green"
            />
            <StatCard
              icon={FiFileText}
              title="Assignments"
              value={reportsData.assignments || 0}
              color="purple"
            />
            <StatCard
              icon={FiAward}
              title="Total Grades"
              value={reportsData.grades || 0}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Grade Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiBarChart2 className="mr-2" size={20} />
            Grade Distribution
          </h3>
          <div className="space-y-3">
            {['A', 'B', 'C', 'D', 'F'].map((grade) => {
              const count = gradeDistribution[grade] || 0;
              const total = Object.values(gradeDistribution).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={grade} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Grade {grade}</span>
                    <span className="text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        grade === 'A' ? 'bg-green-600' :
                        grade === 'B' ? 'bg-blue-600' :
                        grade === 'C' ? 'bg-yellow-600' :
                        grade === 'D' ? 'bg-orange-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiTrendingUp className="mr-2" size={20} />
            Performance Trends
          </h3>
          <div className="space-y-4">
            {user.role === 'student' && reportsData && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Your Performance</p>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Average Grade</span>
                      <span className="font-bold">{reportsData.averageGrade || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          (reportsData.averageGrade || 0) >= 70 ? 'bg-green-600' :
                          (reportsData.averageGrade || 0) >= 60 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${reportsData.averageGrade || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {user.role === 'student'
                  ? 'Track your academic progress over time and identify areas for improvement.'
                  : user.role === 'teacher'
                  ? 'Monitor student performance trends and identify students who may need additional support.'
                  : 'View comprehensive analytics about your children\'s academic performance.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Detailed Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <FiBook className="text-blue-600 mb-2" size={24} />
            <h4 className="font-semibold mb-1">Course Performance</h4>
            <p className="text-sm text-gray-600">View detailed performance metrics by course</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <FiCalendar className="text-orange-600 mb-2" size={24} />
            <h4 className="font-semibold mb-1">Attendance Report</h4>
            <p className="text-sm text-gray-600">Comprehensive attendance analysis and trends</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <FiAward className="text-green-600 mb-2" size={24} />
            <h4 className="font-semibold mb-1">Grade Analysis</h4>
            <p className="text-sm text-gray-600">Detailed grade breakdown and statistics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;

