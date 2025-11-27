import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiBook,
  FiFileText,
  FiAward,
  FiCalendar,
  FiMessageSquare,
  FiUsers,
  FiBarChart2,
} from 'react-icons/fi';

const Navigation = ({ isOpen, onClose }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;

  const navItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard', roles: ['student', 'teacher', 'admin'] },
    { path: '/parents-dashboard', icon: FiHome, label: 'Parent Dashboard', roles: ['parent'] },
    { path: '/courses', icon: FiBook, label: 'Courses', roles: ['student', 'parent', 'teacher', 'admin'] },
    { path: '/assignments', icon: FiFileText, label: 'Assignments', roles: ['student', 'parent', 'teacher', 'admin'] },
    { path: '/grades', icon: FiAward, label: 'Grades', roles: ['student', 'parent', 'teacher', 'admin'] },
    { path: '/attendance', icon: FiCalendar, label: 'Attendance', roles: ['student', 'parent', 'teacher', 'admin'] },
    { path: '/messages', icon: FiMessageSquare, label: 'Messages', roles: ['student', 'parent', 'teacher', 'admin'] },
    { path: '/students', icon: FiUsers, label: 'Students', roles: ['teacher', 'admin'] },
    { path: '/reports', icon: FiBarChart2, label: 'Reports', roles: ['student', 'parent', 'teacher', 'admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col pt-16 lg:pt-0">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-100 text-primary-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icon className="mr-3" size={20} />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              EduBridge Africa © 2024
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Empowering Education in Africa
            </p>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;

