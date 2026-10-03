import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import CampusEdgeLogo from './CampusEdgeLogo';
import { ThemeToggle } from './ThemeContext';
import { useToast } from './Toast';
import { API_BASE } from './api';

export default function AuthPages({ initialMode = 'login', onAuthSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError, showWarning } = useToast();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [role, setRole] = useState('student'); // 'student' | 'admin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [hometown, setHometown] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync mode with route if needed
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Handle Google OAuth query redirect if present
  useEffect(() => {
    const googleUserParam = searchParams.get('googleUser');
    if (googleUserParam) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(googleUserParam));
        localStorage.setItem('user', JSON.stringify(parsedUser));
        if (onAuthSuccess) {
          onAuthSuccess(parsedUser, parsedUser.token);
        }
        showSuccess(`Welcome back, ${parsedUser.name}!`);
        navigate(parsedUser.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      } catch (err) {
        console.error('Failed to parse Google OAuth user:', err);
        showError('Google authentication failed. Please try again.');
      }
    }
  }, [searchParams, onAuthSuccess, showSuccess, showError, navigate]);

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isRegister = mode === 'register';
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showWarning('Email Address is required.');
      return;
    }
    if (!password.trim()) {
      showWarning('Password is required.');
      return;
    }
    if (password.length < 6) {
      showWarning('Password must be at least 6 characters long.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        showWarning('Full Name is required for registration.');
        return;
      }
      if (!address || address.trim() === '') {
        showWarning('Current City / Location is mandatory for campus placements.');
        return;
      }
      if (role === 'admin' && (!adminSecretKey || adminSecretKey.trim() === '')) {
        showWarning('Admin Secret Passphrase is required to create an Admin account.');
        return;
      }
    }

    setSubmitting(true);
    const endpoint = isRegister ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;
    const payload = isRegister 
      ? { name: name.trim(), email: cleanEmail, password, role, adminSecretKey, address: address.trim(), dob, hometown }
      : { email: cleanEmail, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        const loggedUser = data.user || data;
        const completeUser = {
          ...loggedUser,
          token: data.token || loggedUser.token || ''
        };

        // Role restriction check
        if (!isRegister && role === 'admin' && completeUser.role !== 'admin') {
          showError('Access denied: This account does not possess administrator privileges.');
          setSubmitting(false);
          return;
        }

        localStorage.setItem('user', JSON.stringify(completeUser));
        if (onAuthSuccess) {
          onAuthSuccess(completeUser, completeUser.token);
        }

        showSuccess(data.message || (isRegister ? 'Account created successfully!' : 'Login successful!'));
        navigate(completeUser.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      } else {
        showError(data.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      showError('Unable to connect to the backend server. Please verify backend is running on port 5000.');
    }
    setSubmitting(false);
  };

  const isRegisterMode = mode === 'register';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg animate-fade-in relative z-10 my-8">
        
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer group"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Home
          </Link>
          <ThemeToggle />
        </div>

        {/* Brand & Heading */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="mb-3 hover:scale-105 transition-transform">
            <CampusEdgeLogo size="md" showText={false} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isRegisterMode ? 'Join CampusEdge' : 'Welcome Back'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
            {isRegisterMode 
              ? 'Create your account to unlock AI mock tests, proctoring & placement tools.' 
              : 'Sign in to access your student or placement officer dashboard.'}
          </p>
        </div>

        {/* Mode Toggle Switch (Login vs Register) */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6 border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              navigate('/login');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
              !isRegisterMode 
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              navigate('/register');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
              isRegisterMode 
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Google OAuth Button */}
        <button 
          onClick={handleGoogleAuth}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition shadow-sm mb-5 cursor-pointer group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center my-5">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Or continue with credentials</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 p-3 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Access Role:</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                <input 
                  type="radio" 
                  name="authRole" 
                  value="student" 
                  checked={role === 'student'} 
                  onChange={() => setRole('student')} 
                  className="w-4 h-4 text-indigo-500 accent-indigo-600 cursor-pointer"
                />
                Student 👨‍🎓
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                <input 
                  type="radio" 
                  name="authRole" 
                  value="admin" 
                  checked={role === 'admin'} 
                  onChange={() => setRole('admin')} 
                  className="w-4 h-4 text-indigo-500 accent-indigo-600 cursor-pointer"
                />
                Admin 👑
              </label>
            </div>
          </div>

          {/* Full Name for Registration */}
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white font-medium transition placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="e.g. Dhruvi Rana"
              />
            </div>
          )}

          {/* Admin Secret Passphrase */}
          {isRegisterMode && role === 'admin' && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 p-4 rounded-2xl animate-fade-in space-y-1.5">
              <label className="block text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                Admin Secret Key <span className="text-rose-500">*</span>
              </label>
              <input 
                type="password" 
                placeholder="Enter admin authorization passphrase..."
                value={adminSecretKey}
                onChange={(e) => setAdminSecretKey(e.target.value)}
                required={isRegisterMode && role === 'admin'}
                className="w-full px-4 py-3 border border-amber-400/50 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-amber-600 dark:text-amber-400">Default development passphrase is defined in your server configuration.</p>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white font-medium transition placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="candidate@university.edu"
            />
          </div>

          {/* Location & Personal Details for Student Registration */}
          {isRegisterMode && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5">
                  Current Location / City <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white font-medium transition placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="e.g. Surat, Gujarat"
                />
                <p className="text-[11px] text-slate-500 mt-1">Used for local recruiter drive eligibility verification.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5">Hometown</label>
                  <input 
                    type="text" 
                    value={hometown} 
                    onChange={(e) => setHometown(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-sm text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="e.g. Ahmedabad"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5">Date of Birth</label>
                  <input 
                    type="date" 
                    value={dob} 
                    onChange={(e) => setDob(e.target.value)} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-sm text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Password with Visibility Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 uppercase mb-1.5">
              Password <span className="text-rose-500">* (Min. 6 chars)</span>
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-slate-900 dark:text-white font-medium transition placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition transform active:scale-98 disabled:opacity-50 cursor-pointer text-sm mt-3 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Processing...
              </>
            ) : (
              isRegisterMode ? 'Complete Registration 🚀' : 'Sign In to Dashboard ➔'
            )}
          </button>
        </form>

        {/* Footer Hint */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {isRegisterMode ? (
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setMode('login');
                  navigate('/login');
                }}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Sign In here
              </button>
            </p>
          ) : (
            <p>
              Need a student account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setMode('register');
                  navigate('/register');
                }}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Register for free
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}