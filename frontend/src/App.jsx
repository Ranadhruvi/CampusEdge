import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import AuthPages from './AuthPages';
import AdminAccessGate from './AdminAccessGate';
import CommandPalette from './CommandPalette';
import CampusEdgeLogo from './CampusEdgeLogo';
import { useToast } from './Toast';

// Code Splitting: Lazy-load large dashboard bundles
const StudentDashboard = lazy(() => import('./StudentDashboard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));

// Modern, branded loading fallback
function CampusEdgeLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-slate-100">
      <div className="relative flex flex-col items-center animate-pulse">
        <div className="mb-4 animate-bounce">
          <CampusEdgeLogo size="lg" showText={false} />
        </div>
        <div className="h-2 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-[progress_1.5s_ease-in-out_infinite] w-2/3"></div>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-4">
          Loading CampusEdge Workspace...
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess } = useToast();

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    showSuccess('Logged out successfully! See you soon.');
    navigate('/', { replace: true });
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  return (
    <>
      <Suspense fallback={<CampusEdgeLoadingFallback />}>
        <Routes>
          {/* Public Landing Page */}
          <Route 
            path="/" 
            element={
              <LandingPage 
                onNavigate={(view) => {
                  if (view === 'login') navigate('/login');
                  else if (view === 'register') navigate('/register');
                  else if (view === 'student') navigate(user ? '/dashboard' : '/login');
                  else if (view === 'admin') navigate('/admin');
                  else navigate('/');
                }} 
              />
            } 
          />

          {/* Authentication Pages */}
          <Route 
            path="/login" 
            element={
              user && !location.search.includes('switch') && !location.search.includes('role=') ? (
                <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
              ) : (
                <AuthPages initialMode="login" onAuthSuccess={handleAuthSuccess} />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              user && !location.search.includes('switch') && !location.search.includes('role=') ? (
                <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
              ) : (
                <AuthPages initialMode="register" onAuthSuccess={handleAuthSuccess} />
              )
            } 
          />

          {/* Protected Student Dashboard */}
          <Route 
            path="/dashboard/*" 
            element={
              user ? (
                <StudentDashboard 
                  user={user} 
                  onLogout={handleLogout} 
                  onViewLanding={() => navigate('/')} 
                />
              ) : (
                <Navigate to="/login" replace state={{ from: location }} />
              )
            } 
          />

          {/* Protected Admin Dashboard with Seamless Elevation Gate */}
          <Route 
            path="/admin/*" 
            element={
              user && user.role === 'admin' ? (
                <AdminDashboard 
                  user={user} 
                  onLogout={handleLogout} 
                  onViewLanding={() => navigate('/')} 
                />
              ) : (
                <AdminAccessGate 
                  currentUser={user} 
                  onElevateSuccess={(elevatedUser) => {
                    setUser(elevatedUser);
                    navigate('/admin', { replace: true });
                  }} 
                  onLogout={handleLogout} 
                />
              )
            } 
          />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
        onNavigate={(tabId) => {
          if (tabId === 'landing' || tabId === 'home') {
            navigate('/');
          } else if (tabId === 'login') {
            navigate('/login');
          } else if (tabId === 'register') {
            navigate('/register');
          } else if (tabId === 'admin') {
            navigate('/admin');
          } else {
            // Forward tab switch to active dashboard
            if (!user) {
              navigate('/login');
            } else if (user.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
            const event = new CustomEvent('campusedge_navigate', { detail: tabId });
            window.dispatchEvent(event);
          }
        }} 
      />
    </>
  );
}
