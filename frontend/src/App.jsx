import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Courses from './components/Courses';
import Assignments from './components/Assignments';
import Grades from './components/Grades';
import Messages from './components/Messages';
import Attendance from './components/Attendance';
import Resources from './components/Resources';
import Features from './components/Features';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const wasAuthenticated = isAuthenticated;
      const nowAuthenticated = !!token;
      
      if (wasAuthenticated !== nowAuthenticated) {
        setIsAuthenticated(nowAuthenticated);
      }
      setLoading(false);
    };

    // Check auth on mount
    checkAuth();

    // Listen for custom auth event (triggered by Login component)
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    // Also check periodically
    const interval = setInterval(checkAuth, 200);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50">
                <Header onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />
                <div className="flex">
                  <Navigation isOpen={isMenuOpen} onClose={closeMenu} />
                  <main className="flex-1 p-6 lg:p-8">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/courses" element={<Courses />} />
                      <Route path="/assignments" element={<Assignments />} />
                      <Route path="/grades" element={<Grades />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/resources" element={<Resources />} />
                      <Route path="/features" element={<Features />} />
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

