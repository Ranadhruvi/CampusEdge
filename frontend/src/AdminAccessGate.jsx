import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CampusEdgeLogo from './CampusEdgeLogo';
import { ThemeToggle } from './ThemeContext';
import { useToast } from './Toast';
import { apiFetch, API_BASE } from './api';

export default function AdminAccessGate({ currentUser, onElevateSuccess, onLogout }) {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();

  const [passphrase, setPassphrase] = useState('CampusEdge2026');
  const [loading, setLoading] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  // For unauthenticated users attempting /admin
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gateMode, setGateMode] = useState(currentUser ? 'elevate' : 'login'); // 'elevate' | 'login' | 'quick_unlock'

  // Auto-verify if current user already has admin rights in database or via default master passphrase
  useEffect(() => {
    let isMounted = true;
    if (currentUser?.email) {
      apiFetch('/api/auth/unlock-admin', {
        method: 'POST',
        body: JSON.stringify({
          email: currentUser.email.toLowerCase().trim(),
          adminSecretKey: 'CampusEdge2026'
        })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted && data?.user?.role === 'admin') {
          const updatedUser = {
            ...data.user,
            token: data.token || (currentUser?.token || '')
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          if (onElevateSuccess) {
            onElevateSuccess(updatedUser);
          }
        }
      })
      .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [currentUser]);

  // Handle Elevating Existing Logged-in Account or Quick Unlock
  const handleElevate = async (e) => {
    e.preventDefault();
    const targetEmail = (currentUser?.email || adminEmail).trim().toLowerCase();
    const key = passphrase.trim();

    if (!targetEmail) {
      showWarning('Please enter your administrator email.');
      return;
    }
    if (!key) {
      showWarning('Please enter the Admin Passphrase.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/api/auth/unlock-admin', {
        method: 'POST',
        body: JSON.stringify({
          email: targetEmail,
          adminSecretKey: key
        })
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = {
          ...data.user,
          token: data.token || (currentUser?.token || '')
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        showSuccess(data.message || '👑 Administrator access granted!');
        if (onElevateSuccess) {
          onElevateSuccess(updatedUser);
        }
      } else {
        showError(data.message || 'Failed to verify admin passphrase. Please try again.');
      }
    } catch (err) {
      console.error('Error elevating account:', err);
      showError(`Connection error: Unable to reach backend. Please verify server is running.`);
    }
    setLoading(false);
  };

  // Handle Direct Admin Login (Email + Password)
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail || !adminPassword.trim()) {
      showWarning('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: adminPassword })
      });

      const data = await response.json();

      if (response.ok) {
        const loggedUser = data.user || data;
        const completeUser = {
          ...loggedUser,
          token: data.token || loggedUser.token || ''
        };

        if (completeUser.role !== 'admin') {
          // If role is student, inform them to use the passphrase
          showWarning('This account is registered as a Student. Enter the admin passphrase below to elevate.');
          setGateMode('elevate');
          setLoading(false);
          return;
        }

        localStorage.setItem('user', JSON.stringify(completeUser));
        showSuccess('Welcome back to the Admin Operations Console!');
        if (onElevateSuccess) {
          onElevateSuccess(completeUser);
        }
      } else {
        showError(data.message || 'Invalid administrator credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      showError(`Connection error: Unable to reach backend at ${API_BASE}.`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-amber-500/15 via-indigo-600/15 to-purple-600/15 blur-[140px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* Top Bar */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <CampusEdgeLogo 
          size="sm" 
          onClick={() => navigate('/')} 
          className="cursor-pointer"
        />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-900 transition cursor-pointer"
          >
            Campus Home
          </button>
        </div>
      </header>

      {/* Center Gate Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/20 relative">
          
          {/* Glowing Crown Top Badge */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/20">
                👑
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full inline-block">
                  Restricted Console
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  Admin Security Gate
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>v2.5</span>
            </div>
          </div>

          {/* Current Session Banner if logged in */}
          {currentUser && (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5 mb-6 text-xs flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400">Current Active Session</p>
                <p className="font-black text-white truncate">{currentUser.name || 'Student'}</p>
                <p className="text-slate-400 text-[11px] truncate">{currentUser.email}</p>
              </div>
              <span className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                {currentUser.role || 'student'}
              </span>
            </div>
          )}

          {/* Subheading / Description */}
          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            Administrator clearance is required to manage placement question vaults, review AI mock interview sessions, monitor coding submissions, and broadcast campus circulars.
          </p>

          {/* MODE: Elevate Existing Account or Quick Unlock */}
          {gateMode === 'elevate' && (
            <form onSubmit={handleElevate} className="space-y-4">
              {!currentUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Administrator Email Address
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@university.edu"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-hidden transition"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Master Admin Passphrase
                  </label>
                  <span className="text-[11px] text-amber-400/90 font-mono">
                    Key: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 border border-slate-800">CampusEdge2026</code>
                  </span>
                </div>
                
                <div className="relative">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter passphrase (CampusEdge2026)"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                  >
                    {showPassphrase ? '👁️' : '🔒'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Submitting this verified secret immediately grants full administrator rights to your account.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin text-base">⏳</span>
                ) : (
                  <span>👑 Unlock & Enter Admin Console</span>
                )}
              </button>
            </form>
          )}

          {/* MODE: Direct Admin Login */}
          {gateMode === 'login' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@university.edu"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                  >
                    {showPassword ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin text-base">⏳</span>
                ) : (
                  <span>Sign In as Administrator ➔</span>
                )}
              </button>
            </form>
          )}

          {/* Toggle Modes and Navigation Links */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col gap-2.5 text-xs">
            {gateMode === 'elevate' ? (
              <button
                type="button"
                onClick={() => setGateMode('login')}
                className="text-amber-400 hover:text-amber-300 font-bold transition text-center cursor-pointer"
              >
                Already have an Admin account? Sign In with Password ➔
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setGateMode('elevate')}
                className="text-amber-400 hover:text-amber-300 font-bold transition text-center cursor-pointer"
              >
                Have the Master Passphrase? Unlock with Passphrase ➔
              </button>
            )}

            <div className="flex items-center justify-between text-slate-400 pt-2 text-[11px]">
              {currentUser && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  <span>🎓</span> Return to Student Hub
                </button>
              )}

              {currentUser && onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setGateMode('login');
                  }}
                  className="hover:text-rose-400 transition cursor-pointer"
                >
                  Log Out
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/')}
                className="hover:text-white transition cursor-pointer ml-auto"
              >
                Back to Home
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-900">
        CampusEdge Placement Operating System • Master Admin Security Gateway
      </footer>
    </div>
  );
}
