import React, { useState } from 'react';
import CampusEdgeLogo from './CampusEdgeLogo';
import { ThemeToggle } from './ThemeContext';
import { API_BASE } from './api';
import LandingChatbot from './LandingChatbot';

export default function LandingPage({ onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const features = [
    {
      icon: '🧠',
      title: '1,000+ MCQ Practice Arena',
      desc: 'Master verified placement questions across DSA, OS, DBMS, Networks, React, Python, Java, and Aptitude with instant timer and detailed explanations.',
      badge: '17 Subjects',
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
    },
    {
      icon: '🎙️',
      title: 'AI Speech Mock Interviews',
      desc: 'Simulate realistic technical and HR interview rounds with speech interaction. Gemini AI listens to your voice answers, asks follow-ups, and scores your communication.',
      badge: 'Live Voice AI',
      badgeColor: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
    },
    {
      icon: '📄',
      title: 'Instant ATS Resume Audit',
      desc: 'Upload your PDF resume to get a score out of 100, identify missing technical keywords, and optimize formatting against Fortune 500 recruitment standards.',
      badge: 'Match Score',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
    },
    {
      icon: '💻',
      title: 'Multi-Language Coding Arena',
      desc: 'Solve algorithmic challenges in Python, C++, Java, and JavaScript with an in-browser code editor, instant execution, and automated test cases.',
      badge: 'Live Compiler',
      badgeColor: 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Sign Up Free in 10s',
      desc: 'Create your student profile with email or Google sign-in. Select your engineering branch and target companies.'
    },
    {
      number: '02',
      title: 'Practice & Assess',
      desc: 'Take timed MCQ mock tests, run code in the browser compiler, and scan your resume against ATS benchmarks.'
    },
    {
      number: '03',
      title: 'Ace Campus Placements',
      desc: 'Simulate voice interviews with AI, track college recruitment circulars, and secure your dream offer.'
    }
  ];

  const faqs = [
    {
      q: 'Is CampusEdge completely free for students?',
      a: 'Yes, 100% free! All practice question banks, AI speech mock interviews, ATS resume audits, and coding compilers are available with zero paywalls.'
    },
    {
      q: 'Can students from non-computer science branches use this?',
      a: 'Absolutely. We support CSE, IT, AI/DS, Electronics (ECE), Electrical (EEE), Mechanical, Civil, and Management (MBA) disciplines with quantitative aptitude and core subjects.'
    },
    {
      q: 'How does the ATS Resume Scanner work?',
      a: 'It scans your PDF resume against real-world tech job requirements, scoring keyword density, skill coverage, and format readability out of 100.'
    },
    {
      q: 'How do the AI Mock Interviews work?',
      a: 'Using web speech recognition and Gemini AI, the simulator conducts spoken HR and technical rounds, analyzing your problem-solving depth, tone, and technical accuracy.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Background Gradient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-600/15 dark:via-purple-600/15 dark:to-pink-600/10 blur-[130px] rounded-full pointer-events-none -z-10"></div>
      
      {/* Modern Clean Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 sm:px-8 md:px-12 py-3.5 flex justify-between items-center sticky top-0 z-40 shadow-xs">
        <CampusEdgeLogo 
          size="sm" 
          className="cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        <nav className="hidden md:flex items-center space-x-7 text-xs font-bold text-slate-600 dark:text-slate-400">
          <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How It Works</a>
          <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQs</a>
          <button 
            onClick={() => onNavigate('admin')} 
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
          >
            <span>👑</span> Admin Deck
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <button 
            onClick={() => onNavigate('login')}
            className="text-slate-700 dark:text-slate-300 font-bold hover:text-slate-900 dark:hover:text-white transition px-3 sm:px-4 py-2 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
          >
            Log In
          </button>
          
          <button 
            onClick={() => onNavigate('register')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl font-black text-xs shadow-md shadow-indigo-600/20 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <span>➔</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-12 sm:pt-16 pb-16 text-center max-w-4xl mx-auto w-full">
        
        {/* Simple Top Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 px-3.5 py-1.5 rounded-full text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>100% Free Campus Placement Workspace</span>
        </div>

        {/* Clear, Punchy Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-5 leading-[1.15] text-slate-900 dark:text-white">
          Crack Your Campus Placements with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
            Intelligent AI.
          </span>
        </h1>
        
        {/* Simple Clear Subtitle */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8 max-w-2xl font-medium leading-relaxed">
          Everything university students need to land top tech & core recruitment offers: 
          <strong> 1,000+ verified technical MCQs</strong>, live AI speech mock interviews, an online code compiler, and instant ATS resume scoring.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 w-full max-w-md justify-center">
          <button 
            onClick={() => onNavigate('register')}
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white px-7 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/25 transition transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Create Free Account</span> ➔
          </button>
          
          <button 
            onClick={handleGoogleAuth}
            className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xs transition text-center flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Quick Highlights Strip */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-bold text-slate-500 dark:text-slate-400 mb-16">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> 1,000+ Verified MCQs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> AI Voice Interviews
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> Instant ATS Resume Check
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> No Credit Card Required
          </span>
        </div>

        {/* Section 1: Core Platform Features */}
        <section id="features" className="w-full mb-20 text-left">
          <div className="text-center max-w-lg mx-auto mb-10">
            <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
              Platform Features
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              Everything Needed for Placement Success
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Purpose-built tools designed to tackle each stage of university campus recruitment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition duration-200 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl group-hover:scale-110 transition duration-200">
                    {f.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${f.badgeColor}`}>
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1.5">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: How It Works */}
        <section id="how-it-works" className="w-full mb-20 text-left">
          <div className="text-center max-w-lg mx-auto mb-10">
            <span className="text-[11px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider bg-purple-50 dark:bg-purple-950/80 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-500/30">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              How CampusEdge Works
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Go from zero preparation to interview-ready in three easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs space-y-2 relative"
              >
                <span className="text-2xl font-black text-indigo-600/30 dark:text-indigo-400/30 block font-mono">
                  {s.number}
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Frequently Asked Questions */}
        <section id="faq" className="w-full max-w-2xl mx-auto mb-20 text-left">
          <div className="text-center mb-8">
            <span className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
              Clear Answers
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-2.5">
            {faqs.map((item, idx) => {
              const isExpanded = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isExpanded ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex justify-between items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <span>{item.q}</span>
                    <span className="text-slate-400 text-xs font-mono shrink-0">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 font-medium">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Final CTA Box */}
        <section className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-8 sm:p-10 rounded-3xl shadow-xl text-center space-y-4 relative overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Ready to secure your dream placement offer?
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto font-medium leading-relaxed">
            Join thousands of university students practicing daily with real-time AI mock interviews, code compiler, and verified tests.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('register')}
              className="bg-white hover:bg-slate-100 text-indigo-950 font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Create Your Free Account</span>
              <span>➔</span>
            </button>
          </div>
        </section>

      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center max-w-5xl mx-auto w-full gap-3">
        <CampusEdgeLogo size="sm" />
        <p>© 2026 CampusEdge. 100% Free Placement Preparation for University Students.</p>
        <div className="flex gap-4 text-slate-500 dark:text-slate-400 font-medium items-center text-xs">
          <a href="#features" className="hover:text-indigo-600 dark:hover:text-white transition">Features</a>
          <a href="#faq" className="hover:text-indigo-600 dark:hover:text-white transition">FAQs</a>
          <button onClick={() => onNavigate('admin')} className="text-amber-600 dark:text-amber-400 font-bold hover:text-amber-500 transition cursor-pointer flex items-center gap-1">
            <span>👑</span> Admin Deck
          </button>
          <button onClick={() => onNavigate('login')} className="hover:text-indigo-600 dark:hover:text-white transition cursor-pointer">Login</button>
        </div>
      </footer>

      {/* Floating Interactive AI Placement Advisor Chatbot */}
      <LandingChatbot onNavigate={onNavigate} />

    </div>
  );
}
