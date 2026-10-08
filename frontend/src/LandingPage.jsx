import React, { useState, useEffect } from 'react';
import CampusEdgeLogo from './CampusEdgeLogo';
import { ThemeToggle } from './ThemeContext';
import { API_BASE } from './api';


export default function LandingPage({ onNavigate }) {
  const [activeDemoTab, setActiveDemoTab] = useState('ats'); // 'ats' | 'interview' | 'compiler' | 'mock'
  const [atsScore, setAtsScore] = useState(88);
  const [atsTargetRole, setAtsTargetRole] = useState('Full Stack Software Engineer');
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Real-time animation ticker
  const [liveStudentsCount, setLiveStudentsCount] = useState(1482);
  const [placedTickerIndex, setPlacedTickerIndex] = useState(0);

  const PLACED_TICKER = [
    { name: "Priya S.", company: "Microsoft", role: "Software Engineer", package: "₹44.2 LPA", time: "2m ago" },
    { name: "Rahul M.", company: "Amazon AWS", role: "Cloud Support Eng", package: "₹32.5 LPA", time: "6m ago" },
    { name: "Ananya K.", company: "L&T Heavy Eng", role: "Mechanical Lead", package: "₹16.8 LPA", time: "11m ago" },
    { name: "Vikram R.", company: "Deloitte", role: "Business Consultant", package: "₹18.4 LPA", time: "15m ago" },
    { name: "Sneha P.", company: "Goldman Sachs", role: "Quantitative Analyst", package: "₹28.0 LPA", time: "18m ago" }
  ];

  useEffect(() => {
    const studentInterval = setInterval(() => {
      setLiveStudentsCount(prev => prev + (Math.random() > 0.4 ? 1 : -1));
    }, 4000);

    const tickerInterval = setInterval(() => {
      setPlacedTickerIndex(prev => (prev + 1) % PLACED_TICKER.length);
    }, 3500);

    return () => {
      clearInterval(studentInterval);
      clearInterval(tickerInterval);
    };
  }, []);

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };


  const FAQS = [
    {
      q: "Is CampusEdge completely free for students?",
      a: "Yes! All 2,050+ MCQ questions, AI HR voice simulations, live code compiler, and ATS resume audits are 100% free for all students."
    },
    {
      q: "Can students from non-computer science branches use CampusEdge?",
      a: "Absolutely. CampusEdge supports CSE, AI/DS, Electronics, Electrical, Mechanical, Civil, Biotech, and MBA disciplines, plus custom role creation at runtime."
    },
    {
      q: "How does the ATS Resume Scanner calculate scores?",
      a: "It parses your PDF resume against real-world FAANG and Fortune 500 job descriptions, identifying key missing technical competencies, formatting errors, and action verbs."
    },
    {
      q: "How does the AI Voice Mock Interview work?",
      a: "It uses speech-to-text to conduct interactive voice interviews, grading your technical depth, problem-solving structure, and communication clarity in real-time."
    }
  ];

  const currentTicker = PLACED_TICKER[placedTickerIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      
      {/* Background Animated Ambient Gradient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-600/20 dark:via-purple-600/20 dark:to-pink-600/10 blur-[140px] rounded-full pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute top-[600px] right-[-100px] w-[500px] h-[500px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none -z-10"></div>
      
      {/* Real-Time Placement Notification Bar */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/90 dark:via-purple-950/90 dark:to-indigo-950/90 border-b border-indigo-200 dark:border-indigo-500/30 py-2 px-4 text-center text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center justify-center gap-3 overflow-hidden">
        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span> Live Placed
        </span>
        <div className="flex items-center gap-2 transition-all duration-500 animate-fade-in">
          <span className="text-slate-900 dark:text-white font-bold">{currentTicker.name}</span>
          <span className="text-slate-500 dark:text-slate-400">placed at</span>
          <span className="text-indigo-700 dark:text-indigo-300 font-black">{currentTicker.company}</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-300 dark:border-emerald-500/30">{currentTicker.package}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">({currentTicker.time})</span>
        </div>
      </div>

      {/* Floating Modern Header */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl px-3 sm:px-6 md:px-12 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm dark:shadow-xl">
        <CampusEdgeLogo 
          size="sm" 
          className="sm:scale-100 origin-left"
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
        />
        
        <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-600 dark:text-slate-400">
          <a href="#demo" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Interactive Lab</a>
          <a href="#recruiters" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Top Recruiters</a>
          <a href="#stories" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Success Stories</a>
          <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQs</a>
          <button 
            onClick={() => onNavigate('admin')} 
            className="hover:text-amber-500 dark:hover:text-amber-400 text-amber-600 dark:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
          >
            <span>👑</span> Admin Portal
          </button>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          
          <button 
            onClick={() => onNavigate('admin')}
            className="text-amber-700 dark:text-amber-300 font-bold hover:text-amber-900 dark:hover:text-amber-200 transition px-2.5 sm:px-3 py-2 text-xs rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer flex items-center gap-1"
            title="Administrator Operations Console"
          >
            <span>👑</span>
            <span className="hidden sm:inline">Admin</span>
          </button>

          <button 
            onClick={() => onNavigate('login')}
            className="text-slate-700 dark:text-slate-300 font-bold hover:text-slate-900 dark:hover:text-white transition px-2.5 sm:px-4 py-2 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
          >
            Log In
          </button>
          
          <button 
            onClick={() => onNavigate('register')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 sm:px-4 py-2 rounded-xl font-black text-xs shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1"
          >
            <span className="hidden sm:inline">Get Started</span>
            <span className="sm:hidden">Join</span>
            <span>➔</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-16 text-center max-w-5xl mx-auto w-full">
        
        {/* Real-time Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/40 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-indigo-700 dark:text-indigo-300 font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-6 shadow-xs max-w-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping shrink-0"></span>
          <span className="truncate">{liveStudentsCount.toLocaleString()} Students Active Online</span>
          <span className="bg-indigo-100 dark:bg-indigo-600/40 text-indigo-800 dark:text-indigo-200 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black shrink-0">v2.5</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-2xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 max-w-3xl leading-[1.18] sm:leading-[1.15] text-slate-900 dark:text-white">
          Crack your campus placements with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
            Intelligent AI.
          </span>
        </h1>
        
        <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 mb-8 max-w-2xl font-medium leading-relaxed">
          Master <strong>2,050+ technical MCQs</strong>, practice live speech interviews with AI, compile code in real-time, audit your resume against ATS bots, and track company eligibility.
        </p>

        {/* Hero Call-To-Action */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12 w-full max-w-sm justify-center">
          <button 
            onClick={() => onNavigate('register')}
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Practicing Free</span> ➔
          </button>
          
          <button 
            onClick={handleGoogleAuth}
            className="bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google Sign-In</span>
          </button>
        </div>

        {/* Floating Metrics Pill Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl mb-16 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="text-center p-2">
            <p className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">2,050+</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">MCQ Repository</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">10 Streams</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Tech, Core & MBA</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">Live Compiler</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Python, JS, Java, C++</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">100% Free</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">University Verified</p>
          </div>
        </div>

        {/* ==========================================
            UNIFIED ALL-IN-ONE INTERACTIVE LAB (COMPACT SHOWCASE)
            ========================================== */}
        <div id="demo" className="w-full max-w-4xl mb-16 text-left space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider">
                ⚡ Interactive Lab Preview
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">Experience Platform Tools Live</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Click any tab below to test live</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
            
            {/* Interactive Showcase Tabs */}
            <div className="bg-slate-50 dark:bg-slate-950 p-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
              {[
                { id: 'ats', label: 'ATS Resume Audit', icon: '📄' },
                { id: 'interview', label: 'AI Voice Interview', icon: '🎙️' },
                { id: 'compiler', label: 'Code Compiler', icon: '💻' },
                { id: 'mock', label: '2,050+ MCQ Arena', icon: '🧠' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemoTab(tab.id)}
                  className={`flex-1 min-w-[110px] sm:min-w-[140px] py-2 sm:py-2.5 px-2 sm:px-3 rounded-2xl text-[11px] sm:text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                    activeDemoTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/60 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-900'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENT 1: ATS SCANNER */}
            {activeDemoTab === 'ats' && (
              <div className="p-6 space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">Audited Role</span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{atsTargetRole}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Benchmarked against Google, Microsoft & Amazon job specifications</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">ATS Score</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">88/100</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-center text-xl text-emerald-700 dark:text-emerald-300">
                      ✓
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">✓ Matched Keywords Found</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['React.js', 'Node.js', 'PostgreSQL', 'RESTful APIs', 'Docker', 'System Design'].map(k => (
                        <span key={k} className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">{k}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">⚠️ Recommended Additions</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Redis Caching', 'CI/CD Pipelines', 'Unit Testing (Jest)'].map(k => (
                        <span key={k} className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: AI VOICE INTERVIEW */}
            {activeDemoTab === 'interview' && (
              <div className="p-6 space-y-4 animate-fade-in">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-lg">
                      🎙️
                    </div>
                    <div>
                      <span className="text-xs font-black text-purple-700 dark:text-purple-300">Gemini Technical HR Interviewer</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Live Speech Simulation • Question 2 of 5</p>
                    </div>
                    <span className="ml-auto text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-md animate-pulse">
                      Live Audio
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic shadow-xs">
                    "Can you explain the difference between Process and Thread in Operating Systems, and how context switching overhead differs between them?"
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-ping"></span>
                      <span>Real-time speech transcription active</span>
                    </span>
                    <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">Accuracy Score: 92/100</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: CODE COMPILER */}
            {activeDemoTab === 'compiler' && (
              <div className="p-6 space-y-4 animate-fade-in font-mono">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-cyan-700 dark:text-cyan-400 font-bold font-sans">Challenge: Two Sum (Optimal O(N) Hash Map)</span>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-sans font-bold">
                      ✓ All 5/5 Cases Passed (4ms)
                    </span>
                  </div>

                  <pre className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-x-auto shadow-xs">
{`function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
}`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: MCQ ARENA */}
            {activeDemoTab === 'mock' && (
              <div className="p-6 space-y-4 animate-fade-in">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-700 dark:text-indigo-400 font-bold">Database Management & SQL • Hard</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">⏱️ 00:48 remaining</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-200 font-medium text-sm">
                    Which index structure provides the lowest disk I/O overhead for range query evaluation in relational databases?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {['A) Hash Index', 'B) B+ Tree Index (Correct ✓)', 'C) Binary Search Tree', 'D) Red-Black Tree'].map((opt, i) => (
                      <div key={i} className={`p-2.5 rounded-xl border font-medium ${i === 1 ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400'}`}>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Top Recruiters Moving Strip */}
        <div id="recruiters" className="w-full max-w-4xl mb-16 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Top Recruiters Hiring Through Campus Drives</p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {[
              { name: 'Google', tier: 'Big Tech' },
              { name: 'Microsoft', tier: 'Software' },
              { name: 'Amazon', tier: 'Cloud & Tech' },
              { name: 'L&T Core', tier: 'Core & Infra' },
              { name: 'Tata Motors', tier: 'Automotive' },
              { name: 'Deloitte', tier: 'Consulting' },
              { name: 'Goldman Sachs', tier: 'Finance' },
              { name: 'TCS Digital', tier: 'Enterprise' }
            ].map((c) => (
              <div key={c.name} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{c.name}</span>
                <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">{c.tier}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Success Stories (Compact 3-Card Grid) */}
        <div id="stories" className="w-full max-w-4xl mb-16 text-left space-y-4">
          <div className="text-center max-w-md mx-auto mb-6">
            <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
              Verified Results
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">Placed Students Hall of Fame</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Priya S.', role: 'Software Engineer', company: 'Microsoft', pkg: '₹44.2 LPA', quote: 'The timed Mock Arena and ATS scanner gave me the edge to crack the first round.' },
              { name: 'Rahul M.', role: 'Cloud Support Eng', company: 'Amazon AWS', pkg: '₹32.5 LPA', quote: 'The AI speech interview simulator eliminated my hesitation before the real HR round.' },
              { name: 'Ananya K.', role: 'Mechanical Lead', company: 'L&T Core', pkg: '₹16.8 LPA', quote: 'Having core engineering technical MCQs and roadmaps made preparation effortless.' }
            ].map((s, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.role} • <strong className="text-indigo-600 dark:text-indigo-300">{s.company}</strong></p>
                  </div>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-500/30">{s.pkg}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                  "{s.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Concise FAQ Accordion */}
        <div id="faq" className="w-full max-w-3xl mb-16 text-left space-y-3">
          <div className="text-center mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h3>
          </div>

          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex justify-between items-center cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-300 transition"
              >
                <span>{faq.q}</span>
                <span className="text-base text-slate-500 dark:text-slate-400">{activeFaq === i ? '−' : '+'}</span>
              </button>
              {activeFaq === i && (
                <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Call to Action Card */}
        <div className="w-full max-w-4xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-8 sm:p-10 rounded-3xl shadow-2xl text-center space-y-4 relative overflow-hidden cta-banner">
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md">
              <span>🚀</span> Start Your Placement Journey Today
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ready to secure your dream placement offer?
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto font-medium leading-relaxed">
              Join thousands of university students practicing daily with real-time AI mock interviews, live compiler coding, and verified recruiter cutoffs.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('register')}
                className="bg-white hover:bg-slate-100 text-indigo-900 hover:text-indigo-950 font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl shadow-2xl transition transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Create Your Free Account</span> ➔
              </button>
            </div>
          </div>

          {/* Background Ambient Glow Circles */}
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-purple-900/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>

      </main>

      {/* Minimal Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto w-full gap-3">
        <CampusEdgeLogo size="sm" />
        <p>© 2026 CampusEdge. Empowering student placements across all engineering & management disciplines.</p>
        <div className="flex gap-4 text-slate-500 dark:text-slate-400 font-medium items-center">
          <a href="#demo" className="hover:text-indigo-600 dark:hover:text-white transition">Lab Preview</a>
          <a href="#faq" className="hover:text-indigo-600 dark:hover:text-white transition">FAQs</a>
          <button onClick={() => onNavigate('admin')} className="text-amber-600 dark:text-amber-400 font-bold hover:text-amber-500 transition cursor-pointer flex items-center gap-1">
            <span>👑</span> Admin Deck
          </button>
          <button onClick={() => onNavigate('login')} className="hover:text-indigo-600 dark:hover:text-white transition cursor-pointer">Login</button>
        </div>
      </footer>

    </div>
  );
}
