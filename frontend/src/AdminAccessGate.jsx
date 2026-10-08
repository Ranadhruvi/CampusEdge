import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CampusEdgeLogo from './CampusEdgeLogo';
import { ThemeToggle } from './ThemeContext';
import { useToast } from './Toast';
import { apiFetch, API_BASE } from './api';

export default function AdminAccessGate({ currentUser, onElevateSuccess, onLogout }) {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();

  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  // For unauthenticated users attempting /admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gateMode, setGateMode] = useState('login'); // 'login' | 'elevate'

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

          {/* If a Student Account is currently logged in, SHOW RESTRICTED ACCESS SCREEN */}
          {currentUser && currentUser.role !== 'admin' ? (
            <div className="space-y-6 text-center py-2 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-rose-950/30">
                🛑
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 border border-rose-500/40 px-3 py-1 rounded-full inline-block">
                  Access Restricted
                </span>
                <h2 className="text-xl font-black text-white">Student Account Detected</h2>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  You are signed in as <strong className="text-white">{currentUser.name || 'Student'}</strong> (<span className="text-amber-300 font-mono">{currentUser.email}</span>). 
                  The Administrator Console is strictly restricted to university placement directors and verified faculty administrators.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 text-left space-y-1.5">
                <p className="font-bold text-slate-200 flex items-center gap-2">
                  <span>🔒</span> Student Role Security Policy:
                </p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Student accounts do not have permission to view or manage the recruitment question bank, circular broadcasts, or candidate analytics.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-3 rounded-xl shadow-md transition cursor-pointer"
                >
                  ← Return to Student Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onLogout) onLogout();
                    setGateMode('login');
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition cursor-pointer"
                >
                  Sign In with Admin Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Subheading / Description */}
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Administrator clearance is required to manage placement question vaults, review AI mock interview sessions, monitor coding submissions, and broadcast campus circulars.
              </p>

              {/* MODE: Elevate Existing Account or Quick Unlock */}
              {gateMode === 'elevate' && (
                <form onSubmit={handleElevate} className="space-y-4">
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

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Master Admin Passphrase
                      </label>
                    </div>
                    
                    <div className="relative">
                      <input
                        type={showPassphrase ? 'text' : 'password'}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="Enter master admin passphrase"
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
                      Authorized university administrators with the master key may unlock access here.
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
                      <span>👑 Verify & Unlock Admin Console</span>
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
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    ← Back to Campus Home
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-900">
        CampusEdge Placement Operating System • Master Admin Security Gateway
      </footer>
    </div>
  );
}
