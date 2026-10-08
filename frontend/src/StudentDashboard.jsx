import React, { useState, useEffect } from 'react';
import MockTest from './MockTest'; 
import PracticeMode from './PracticeMode';
import AIInterviewSimulator from './AIInterviewSimulator';
import CompanyEligibilityChecker from './CompanyEligibilityChecker';
import PlacementRoadmap from './PlacementRoadmap';
import Leaderboard from './Leaderboard';
import ResumeChecker from './ResumeChecker';
import PlacementDrivesHub from './PlacementDrivesHub';
import CodingArena from './CodingArena';
import { apiFetch } from './api';
import { useToast } from './Toast';
import { ThemeToggle } from './ThemeContext';
import CampusEdgeLogo from './CampusEdgeLogo';
import UserProgressGraph from './UserProgressGraph';
import PlacementCertificateModal from './PlacementCertificateModal';
import StreakModal from './StreakModal';
import { streakManager } from './streakManager';
import Live1v1Battle from './Live1v1Battle';
import { playSound } from './soundEffects';

const MOCK_SUBJECT_META = {
  "Database Management & SQL": { icon: "🗄️", desc: "ACID, Normalization, Window Functions & SQL Queries", count: 135, group: "core" },
  "Operating Systems": { icon: "💻", desc: "Deadlocks, Paging, Inodes, Mutex vs Semaphore & Scheduling", count: 129, group: "core" },
  "Computer Networks": { icon: "🌐", desc: "OSI 7 Layers, TCP Handshake, DNS, HTTP/3 & Subnetting", count: 128, group: "core" },
  "Data Structures & Algorithms": { icon: "⚡", desc: "Trees, Dynamic Programming, Graphs & Binary Search", count: 114, group: "coding" },
  "Aptitude & Logical Reasoning": { icon: "🧠", desc: "Speed & Distance, Profit/Loss, Probability & Syllogisms", count: 135, group: "aptitude" },
  "React & Modern Frontend": { icon: "⚛️", desc: "Hooks, Virtual DOM, SSR vs SSG & State Management", count: 113, group: "web" },
  "OOP & Design Patterns": { icon: "📐", desc: "SOLID Principles, Factory, Strategy & Facade", count: 111, group: "core" },
  "Python": { icon: "🐍", desc: "Data Types, Generators, Dunder Methods & OOP", count: 110, group: "coding" },
  "Python & Backend": { icon: "⚙️", desc: "FastAPI, Celery, SQLAlchemy, AsyncIO & REST APIs", count: 109, group: "web" },
  "Java": { icon: "☕", desc: "JVM Memory Model, Garbage Collection & Multi-threading", count: 202, group: "coding" },
  "JavaScript": { icon: "🟨", desc: "Event Loop, Closures, Async/Await & ES6+ Modules", count: 128, group: "coding" },
  "HTML": { icon: "🌐", desc: "Semantic HTML5, Web Workers, Canvas & Accessibility", count: 113, group: "web" },
  "System Design & Architecture": { icon: "🏗️", desc: "Scalability, Caching, CAP Theorem, Sharding & Kafka", count: 107, group: "core" },
  "Cyber Security & Auth": { icon: "🛡️", desc: "SQLi, XSS, CSRF, PKCE, JWT & Password Hashing", count: 106, group: "web" },
  "Cloud & DevOps": { icon: "☁️", desc: "Docker Multi-Stage, Kubernetes Pods, CI/CD & Terraform", count: 105, group: "web" },
  "Machine Learning & AI": { icon: "🤖", desc: "Transformers, Attention, Neural Networks & Regression", count: 104, group: "aptitude" },
  "C++ & Low Level Systems": { icon: "⚡", desc: "Move Semantics, RAII, Vtables & Memory Pointers", count: 103, group: "coding" }
};

export default function StudentDashboard({ user: propUser, onLogout, onViewLanding }) {
  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const [user, setUser] = useState(
    propUser || (savedUser ? JSON.parse(savedUser) : { name: 'Student Candidate', email: 'student@campusedge.edu', role: 'student' })
  );

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCertModal, setShowCertModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  
  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('campusedge_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real-time Streak and Gamification Data
  const [streakData, setStreakData] = useState(() => streakManager.getState());

  useEffect(() => {
    const unsub = streakManager.subscribe(setStreakData);
    return () => unsub();
  }, []);

  // Fullscreen tracking for proctored exams
  const [isGlobalFullscreen, setIsGlobalFullscreen] = useState(
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsGlobalFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (propUser && propUser.email) {
      setUser(propUser);
    }
  }, [propUser]);

  useEffect(() => {
    const handleCustomNav = (e) => {
      if (e.detail) {
        setActiveTab(e.detail);
        setActiveTest(null);
      }
    };
    window.addEventListener('campusedge_navigate', handleCustomNav);
    return () => window.removeEventListener('campusedge_navigate', handleCustomNav);
  }, []);

  useEffect(() => {
    if (user && user.email) {
      streakManager.syncWithBackend(user.email);
    }
  }, [user]);

  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // Test Configuration State
  const [selectedCategory, setSelectedCategory] = useState('Database Management & SQL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all'); // 'all', 'Easy', 'Medium', 'Hard'
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState(null);

  // Topic Explorer Filter & Search State
  const [topicSearch, setTopicSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('all'); // 'all', 'core', 'coding', 'web', 'aptitude'

  // Dashboard Metrics & Records
  const [latestAtsScore, setLatestAtsScore] = useState(null);
  const [resumesAnalyzedCount, setResumesAnalyzedCount] = useState(0);
  const [testHistory, setTestHistory] = useState([]);
  const [codingHistory, setCodingHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const userEmail = user?.email || 'student@campusedge.edu';

  // Editable Profile Form State
  const [editName, setEditName] = useState(user?.name || '');
  const [editDob, setEditDob] = useState(user?.dob || '');
  const [editHometown, setEditHometown] = useState(user?.hometown || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('campusedge_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/notifications');
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchDashboardData = async () => {
    setLoadingHistory(true);
    try {
      const effectiveEmail = userEmail || 'student@campusedge.edu';

      // 1. Test History
      const histRes = await apiFetch(`/api/questions/history/${effectiveEmail}`);
      if (histRes.ok) {
        const histData = await histRes.json();
        if (Array.isArray(histData)) {
          setTestHistory(histData);
        }
      }

      // 2. Coding Arena History
      try {
        const codeRes = await apiFetch(`/api/code/history/${effectiveEmail}`);
        if (codeRes.ok) {
          const codeData = await codeRes.json();
          if (Array.isArray(codeData)) {
            setCodingHistory(codeData);
          }
        }
      } catch (cErr) {
        console.warn("Could not fetch coding history:", cErr);
      }

      // 3. Resume History
      const resumeRes = await apiFetch(`/api/resume/history/${effectiveEmail}`);
      if (resumeRes.ok) {
        const resumeData = await resumeRes.json();
        if (Array.isArray(resumeData)) {
          setResumesAnalyzedCount(resumeData.length);
          if (resumeData.length > 0) {
            setLatestAtsScore({
              score: resumeData[0].score,
              targetRole: resumeData[0].target_role || resumeData[0].targetRole || 'Software Engineer'
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchNotifications();
    fetchDashboardData();
  }, [userEmail]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showWarning("Full Name is required.");
      return;
    }
    if (!editAddress.trim()) {
      showWarning("Location / Address is required.");
      return;
    }
    if (newPassword && !currentPassword) {
      showWarning("Please provide current password to set a new one.");
      return;
    }

    try {
      const response = await apiFetch('/api/users/update-profile', {
        method: 'PUT',
        body: JSON.stringify({
          email: userEmail,
          name: editName.trim(),
          dob: editDob,
          hometown: editHometown.trim(),
          address: editAddress.trim(),
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        showSuccess("Profile updated successfully!");
        const updated = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
        setIsEditingProfile(false);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        showError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      showError(err.message || "Server error updating profile.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    } else {
      showSuccess("Logged out successfully!");
      window.location.reload();
    }
  };

  const handleStartTest = async (overrideCategory) => {
    const cat = overrideCategory || selectedCategory;
    setLoading(true);
    try {
      const diffParam = selectedDifficulty !== 'all' ? `&difficulty=${encodeURIComponent(selectedDifficulty)}` : '';
      const response = await apiFetch(`/api/questions/mock-test?category=${encodeURIComponent(cat)}&limit=${questionCount}${diffParam}`);
      if (!response.ok) {
        const errorData = await response.json();
        showError(errorData.message || `No questions found for ${cat}.`);
        setLoading(false);
        return;
      }
      const data = await response.json();
      const testQuestions = Array.isArray(data) ? data : (data.questions || []);

      if (testQuestions.length === 0) {
        showWarning(`No questions available for ${cat} (${selectedDifficulty}).`);
        setLoading(false);
        return;
      }

      if (data.isReset) {
        showInfo(`🎉 Question pool refreshed! Starting a fresh test.`);
      }

      setActiveTest(testQuestions);
    } catch (err) {
      console.error('Error fetching test:', err);
      showError('Failed to connect to the test server.');
    }
    setLoading(false);
  };

  // Structured Navigation Groups
  const navSections = [
    {
      group: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Mission Hub', icon: '🏠', badge: null }
      ]
    },
    {
      group: 'ASSESSMENTS',
      items: [
        { id: 'codingArena', label: 'Coding Arena', icon: '💻', badge: 'Live' },
        { id: 'mockTests', label: 'Mock Test Arena', icon: '📝', badge: 'Timed' },
        { id: 'practice', label: 'Practice Mode', icon: '⚡', badge: 'Self-Paced' }
      ]
    },
    {
      group: 'CAREER & INTERVIEWS',
      items: [
        { id: 'resumeChecker', label: 'ATS Resume Scanner', icon: '📄', badge: 'AI' },
        { id: 'aiInterview', label: 'AI HR Simulator', icon: '🎙️', badge: 'Voice' },
        { id: 'drives', label: 'Campus Drives & Alerts', icon: '📢', badge: 'Recruiting' },
        { id: 'eligibility', label: 'Company Eligibility', icon: '🏢', badge: 'Cutoffs' }
      ]
    },
    {
      group: 'GROWTH & COMMUNITY',
      items: [
        { id: 'progress', label: 'My Growth & Analytics', icon: '📈', badge: null },
        { id: 'leaderboard', label: 'College Leaderboard', icon: '🏆', badge: null },
        { id: 'roadmap', label: 'Placement Roadmap', icon: '🗺️', badge: 'Planner' }
      ]
    }
  ];

  // Filter topics for topic explorer
  const allSubjectKeys = Object.keys(MOCK_SUBJECT_META);
  const filteredTopics = allSubjectKeys.filter(subject => {
    const meta = MOCK_SUBJECT_META[subject];
    const matchesFilter = topicFilter === 'all' || meta.group === topicFilter;
    const matchesSearch = !topicSearch.trim() || 
      subject.toLowerCase().includes(topicSearch.toLowerCase()) ||
      meta.desc.toLowerCase().includes(topicSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate daily mission completion status
  const isCodingDone = codingHistory.length > 0;
  const isMockDone = testHistory.length > 0;
  const isResumeDone = Boolean(latestAtsScore);
  const completedMissionsCount = (isCodingDone ? 1 : 0) + (isMockDone ? 1 : 0) + (isResumeDone ? 1 : 0);

  // Group helpers for sub-module toolbar switcher
  const isAssessmentTab = ['codingArena', 'mockTests', 'practice'].includes(activeTab);
  const isCareerTab = ['resumeChecker', 'aiInterview', 'drives', 'eligibility'].includes(activeTab);
  const isGrowthTab = ['progress', 'leaderboard', 'roadmap'].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">

        {/* Collapsible Modern Sidebar Navigation */}
        {!isGlobalFullscreen && !activeTest && (
          <aside className={`
            fixed md:static inset-y-0 left-0 z-50 flex flex-col 
            bg-white/95 dark:bg-slate-900/95 border-r border-slate-200/80 dark:border-slate-800/80 
            backdrop-blur-2xl transition-all duration-300 shadow-xl md:shadow-none
            ${mobileMenuOpen ? 'w-72 max-w-[85vw]' : (isSidebarCollapsed ? 'w-20' : 'w-64')}
            ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            h-full md:h-auto overflow-y-auto touch-scroll
          `}>
            {/* Sidebar Header with Logo and Collapse Toggle */}
            <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-100 dark:border-slate-800/60`}>
              <CampusEdgeLogo 
                size="sm" 
                showText={!isSidebarCollapsed}
                subtitle="Student Suite"
                onClick={() => { setActiveTab('dashboard'); setActiveTest(null); setMobileMenuOpen(false); }}
              />
              
              <button
                onClick={toggleSidebar}
                className="hidden md:flex w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 items-center justify-center text-xs transition cursor-pointer"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? '➔' : '◀'}
              </button>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* Live Candidate Grid Heartbeat Pill (Matching Admin Style) */}
            {!isSidebarCollapsed && (
              <div className="mx-3 mt-4 mb-2 flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Live Grid Engine</span>
                </div>
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  SYNCED
                </span>
              </div>
            )}

            {/* Navigation Items (Categorized & Scannable) */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {navSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  {!isSidebarCollapsed && (
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500 px-3 block mb-1.5">
                      {section.group}
                    </span>
                  )}
                  {section.items.map((item) => {
                    const isActive = activeTab === item.id && !activeTest;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { 
                          setActiveTab(item.id); 
                          setActiveTest(null); 
                          setMobileMenuOpen(false);
                          playSound('click');
                        }}
                        title={item.label}
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-2xl font-bold text-xs transition-all duration-200 cursor-pointer group ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                            : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                          {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!isSidebarCollapsed && item.badge && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                            isActive 
                              ? 'bg-white/20 text-white shadow-xs' 
                              : 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Candidate Telemetry & Readiness Card (Matching Admin System Telemetry) */}
            {!isSidebarCollapsed && (
              <div className="mx-3 my-2 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/50 border border-indigo-200/60 dark:border-indigo-500/20 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Candidate Telemetry</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Proctored & Ready</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex justify-between">
                    <span>Daily Missions:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completedMissionsCount}/3 Done</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Placement Index:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{Math.min(95, 45 + (testHistory.length * 5) + (codingHistory.length * 5))}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar Bottom Footer: Quick Links & Profile */}
            <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2 mt-auto">
              {!isSidebarCollapsed && (
                <button
                  onClick={() => onViewLanding && onViewLanding()}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>🌐</span>
                    <span>Public Home</span>
                  </div>
                  <span>➔</span>
                </button>
              )}

              {/* User Account Card (Matching Admin Account Card Style) */}
              <div 
                onClick={() => {
                  setEditName(user?.name || '');
                  setEditAddress(user?.address || '');
                  setEditDob(user?.dob || '');
                  setEditHometown(user?.hometown || '');
                  setIsEditingProfile(true);
                }}
                className={`flex items-center gap-3 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-500/50 cursor-pointer transition ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title="Manage Student Profile"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                {!isSidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user?.name || 'Student'}</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate font-bold">Verified Candidate</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Stage */}
        <main className={`flex-1 overflow-y-auto relative bg-slate-50 dark:bg-slate-950 min-w-0 ${isGlobalFullscreen || activeTest ? 'p-0 w-full min-h-screen' : 'p-3.5 sm:p-6 md:p-8'}`}>
          
          {/* Background Ambient Glows (Matching Admin Look) */}
          <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl" />

          {/* Top Persistent Global Header */}
          {!isGlobalFullscreen && !activeTest && (
            <header className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-6 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md z-30">
              
              {/* Left Breadcrumb & Mobile Menu Trigger */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-base shadow-xs"
                >
                  ☰
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl shadow-xs min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-bold truncate hidden xs:inline sm:inline">CampusEdge</span>
                  <span className="text-slate-400 dark:text-slate-500 hidden xs:inline sm:inline">/</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider text-[10px] sm:text-[11px] truncate max-w-[130px] sm:max-w-none">
                    {navSections.flatMap(s => s.items).find(n => n.id === activeTab)?.label || 'Candidate Suite'}
                  </span>
                </div>
              </div>

              {/* Right Global Widgets & Controls */}
              <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
                
                {/* Live Server Status Pill (Matching Admin) */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Live Server</span>
                  <span className="font-mono text-slate-400 text-[10px]">:5000</span>
                </div>

                {/* Search / Command Palette Trigger (Ctrl+K) */}
                <button
                  onClick={() => {
                    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
                    window.dispatchEvent(event);
                  }}
                  className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium shadow-xs cursor-pointer transition"
                  title="Search commands, subjects and modules (Ctrl+K)"
                >
                  <span>🔍</span>
                  <span>Quick jump...</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">Ctrl K</kbd>
                </button>

                {/* Streak Flame Chip */}
                <button
                  onClick={() => { playSound('click'); setShowStreakModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs hover:scale-105 transition cursor-pointer shadow-xs"
                  title="Click to view daily streak & rewards"
                >
                  <span>🔥</span>
                  <span>{streakData.currentStreak || 7}d Streak</span>
                </button>

                {/* Level / XP Chip */}
                <div 
                  onClick={() => { playSound('click'); setShowCertModal(true); }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300 font-bold text-xs cursor-pointer shadow-xs"
                  title="Placement Readiness Index & Verified Certificate"
                >
                  <span>⚡</span>
                  <span>{streakData.totalXP || 2450} XP</span>
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition relative cursor-pointer"
                    title="Placement Announcements"
                  >
                    🔔
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-4 px-4 z-50 animate-fade-in space-y-3">
                      <div className="flex justify-between items-center border-b pb-2 border-slate-200 dark:border-slate-800">
                        <h3 className="font-black text-slate-900 dark:text-white text-xs">Placement Notifications</h3>
                        <button onClick={() => setShowNotifDropdown(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer">✕</button>
                      </div>

                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-6">No new placement notices right now.</p>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">{n.title}</h4>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{n.message}</p>
                              <div className="pt-1.5 flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                <button 
                                  onClick={() => { setShowNotifDropdown(false); setActiveTab('drives'); }}
                                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                >
                                  View Circular ➔
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Deck - strictly restricted to users with admin role */}
                {user?.role === 'admin' && (
                  <a
                    href="/admin"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs hover:scale-105 transition cursor-pointer shadow-xs"
                    title="Open Admin Operations Console"
                  >
                    <span>👑</span>
                    <span>Admin Deck</span>
                  </a>
                )}

                <ThemeToggle />

                {/* Profile Avatar & Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-md hover:scale-105 transition cursor-pointer"
                  >
                    {firstName.charAt(0).toUpperCase()}
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-xs">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Signed in as</p>
                        <p className="font-bold text-slate-900 dark:text-white truncate">{userEmail}</p>
                      </div>

                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          setEditName(user?.name || '');
                          setEditDob(user?.dob || '');
                          setEditHometown(user?.hometown || '');
                          setEditAddress(user?.address || '');
                          setIsEditingProfile(true);
                        }}
                        className="w-full text-left px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <span>👤</span> Manage Profile
                      </button>

                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowCertModal(true);
                        }}
                        className="w-full text-left px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <span>🏆</span> Placement Certificate
                      </button>

                      {user?.role === 'admin' && (
                        <a 
                          href="/admin"
                          className="w-full text-left px-4 py-2.5 font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                        >
                          <span>👑</span> Admin Deck
                        </a>
                      )}

                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1 cursor-pointer"
                      >
                        <span>🚪</span> Log Out
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </header>
          )}

          {/* Sub-Module Secondary Toolbar (Effortless 1-Click Switcher Between Related Tools) */}
          {!isGlobalFullscreen && !activeTest && activeTab !== 'dashboard' && (
            <div className="mb-6 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <button
                onClick={() => { setActiveTab('dashboard'); playSound('click'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer shrink-0"
              >
                <span>←</span>
                <span>Back to Hub</span>
              </button>

              {/* Segmented Switcher for Assessments */}
              {isAssessmentTab && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto touch-scroll no-scrollbar max-w-full pb-0.5">
                  {[
                    { id: 'codingArena', label: '💻 Coding Arena' },
                    { id: 'mockTests', label: '📝 Mock Test' },
                    { id: 'practice', label: '⚡ Practice Mode' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); playSound('click'); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Segmented Switcher for Career & Recruitment */}
              {isCareerTab && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto touch-scroll no-scrollbar max-w-full pb-0.5">
                  {[
                    { id: 'resumeChecker', label: '📄 ATS Resume' },
                    { id: 'aiInterview', label: '🎙️ AI Interview' },
                    { id: 'drives', label: '📢 Placement Drives' },
                    { id: 'eligibility', label: '🏢 Cutoffs' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); playSound('click'); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Segmented Switcher for Analytics */}
              {isGrowthTab && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto touch-scroll no-scrollbar max-w-full pb-0.5">
                  {[
                    { id: 'progress', label: '📈 My Growth' },
                    { id: 'leaderboard', label: '🏆 Leaderboard' },
                    { id: 'roadmap', label: '🗺️ Roadmap' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); playSound('click'); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manage Profile Modal */}
          {isEditingProfile && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-5 sm:p-8 max-h-[92vh] overflow-y-auto touch-scroll animate-fade-in text-slate-900 dark:text-white space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-black">Edit Student Profile Details</h2>
                  <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer">✕</button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Full Legal Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Current City / Location (Address)</label>
                    <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} required placeholder="e.g. Bangalore, Karnataka" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Date of Birth</label>
                      <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Hometown</label>
                      <input type="text" value={editHometown} placeholder="e.g. Mumbai" onChange={(e) => setEditHometown(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none" />
                    </div>
                  </div>

                  <hr className="my-2 border-slate-200 dark:border-slate-800" />
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Change Password (Optional)</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Current Password</label>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-md transition cursor-pointer">
                    Save Profile Changes
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ACTIVE TEST RUNNER */}
          {activeTest ? (
            <MockTest questions={activeTest} onEndTest={() => { setActiveTest(null); fetchDashboardData(); }} />
          ) : activeTab === 'dashboard' ? (
            
            /* ========================================================
               STREAMLINED & DELIGHTFUL MISSION HUB (HOME DASHBOARD)
               ======================================================== */
            <div className="space-y-7 animate-fade-in max-w-7xl mx-auto">
              
              {/* Dismissible Placement Drive Alert Ticker */}
              {!alertDismissed && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-md flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-xl bg-white/20 text-sm shrink-0">📢</span>
                    <p className="font-semibold truncate">
                      <strong className="font-black text-amber-300">Campus Drives Alert:</strong> Amazon SDE & TCS Digital applications closing in &lt;48h.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setActiveTab('drives'); playSound('click'); }}
                      className="px-3 py-1 rounded-xl bg-white text-indigo-950 font-black hover:bg-indigo-50 transition cursor-pointer text-xs"
                    >
                      View Drives →
                    </button>
                    <button 
                      onClick={() => setAlertDismissed(true)} 
                      className="text-white/60 hover:text-white px-1.5 py-0.5"
                      title="Dismiss alert"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Executive Welcome & Status Header */}
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-2 z-10 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                      ⚡ Campus Placement Grid 2026
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">{firstName}</span>! 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Run live multi-language code tests, simulate real AI recruiter interviews, audit ATS resume scores, and track campus recruitment drives.
                  </p>
                </div>

                {/* Readiness Quick Progress Capsule */}
                <div className="w-full lg:w-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-4 shrink-0">
                  <div className="w-full sm:w-auto">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-500">Placement Readiness</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">
                        {Math.min(95, 45 + (testHistory.length * 5) + (codingHistory.length * 5))}%
                      </span>
                    </div>
                    <div className="w-full sm:w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(95, 45 + (testHistory.length * 5) + (codingHistory.length * 5))}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Based on test audits & live compilers</p>
                  </div>

                  <button
                    onClick={() => { playSound('click'); setShowCertModal(true); }}
                    className="w-full sm:w-auto text-center px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer shrink-0"
                  >
                    🏆 Certificate
                  </button>
                </div>
              </div>

              {/* ========================================================
                  EXECUTIVE CANDIDATE KPI RIBBON (MATCHING ADMIN UI/UX STYLE)
                  ======================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                
                {/* Card 1: Placement Readiness Index */}
                <div 
                  onClick={() => { playSound('click'); setShowCertModal(true); }}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                      🏆
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-mono">
                      Verified Status
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
                    {Math.min(95, 45 + (testHistory.length * 5) + (codingHistory.length * 5))}%
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Readiness Score</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span>⚡ Claim Certificate ➔</span>
                    </span>
                  </div>
                </div>

                {/* Card 2: Proctored Assessments */}
                <div 
                  onClick={() => { setActiveTab('mockTests'); playSound('click'); }}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                      📝
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-mono">
                      Proctored Arena
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
                    {testHistory.length}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Mock Tests Taken</span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                      <span>🛡️ Anti-Cheat Active</span>
                    </span>
                  </div>
                </div>

                {/* Card 3: Coding Sandbox Challenges */}
                <div 
                  onClick={() => { setActiveTab('codingArena'); playSound('click'); }}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                      💻
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-mono">
                      Multi-Lang
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
                    {codingHistory.length}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Problems Solved</span>
                    <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
                      <span>⚡ Py, JS, Java, C++</span>
                    </span>
                  </div>
                </div>

                {/* Card 4: ATS Resume & Voice HR */}
                <div 
                  onClick={() => { setActiveTab(latestAtsScore ? 'resumeChecker' : 'aiInterview'); playSound('click'); }}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                      🎙️
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-mono">
                      Gemini AI
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
                    {latestAtsScore ? `${latestAtsScore.score}/100` : `${interviewHistory.length} Logs`}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{latestAtsScore ? 'ATS Match Score' : 'AI Speech Sessions'}</span>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                      <span>🤖 Recruiter Ready</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* ========================================================
                  UNIFIED PLACEMENT WORKSPACE (EXECUTIVE 8-MODULE LAUNCHER)
                  ======================================================== */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <span>⚡</span> Placement Workspace & Tools
                    </h2>
                    <p className="text-xs text-slate-500">Every feature at your fingertips — practice, interview simulations, and recruitment drives</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
                      🎯 Daily Goal: {completedMissionsCount}/3 Done
                    </span>
                  </div>
                </div>

                {/* Unified High-Clarity Grid with Executive Card Styling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* 1. Coding Arena */}
                  <div 
                    onClick={() => { setActiveTab('codingArena'); playSound('click'); }}
                    className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                          💻
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full font-mono ${
                          isCodingDone 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
                            : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30'
                        }`}>
                          {isCodingDone ? '✓ Done' : '+150 XP'}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs group-hover:text-cyan-600 transition">Coding Arena</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Multi-language browser compiler (Python, JS, Java, C++) with test cases.
                      </p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      <span>Launch Compiler</span>
                      <span>➔</span>
                    </div>
                  </div>

                  {/* 2. Mock Test Arena */}
                  <div 
                    onClick={() => { setActiveTab('mockTests'); playSound('click'); }}
                    className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                          📝
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full font-mono ${
                          isMockDone 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30'
                        }`}>
                          {isMockDone ? `✓ ${testHistory.length} Taken` : '+100 XP'}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 transition">Mock Test Arena</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Timed screening assessments with auto-submit countdown & ranking.
                      </p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span>Start Test</span>
                      <span>➔</span>
                    </div>
                  </div>

                  {/* 3. Self-Paced Practice */}
                  <div 
                    onClick={() => { setActiveTab('practice'); playSound('click'); }}
                    className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                          ⚡
                        </div>
                        <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-500/30 px-2.5 py-1 rounded-full font-mono">
                          Self-Paced
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs group-hover:text-amber-600 transition">Practice Mode</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Topic-by-topic questions with instant explanations and bookmarking.
                      </p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-amber-600 dark:text-amber-400">
                      <span>Browse Questions</span>
                      <span>➔</span>
                    </div>
                  </div>

                  {/* 4. AI Voice HR Simulator */}
                  <div 
                    onClick={() => { setActiveTab('aiInterview'); playSound('click'); }}
                    className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                          🎙️
                        </div>
                        <span className="text-[10px] font-black uppercase text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-500/30 px-2.5 py-1 rounded-full font-mono">
                          Gemini Voice
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs group-hover:text-purple-600 transition">AI HR Simulator</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Spoken technical & HR behavioral interview practice with instant AI feedback.
                      </p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-purple-600 dark:text-purple-400">
                      <span>Simulate Speech</span>
                      <span>➔</span>
                    </div>
                  </div>

                  {/* 5. ATS Resume Scanner */}
                  <div 
                    onClick={() => { setActiveTab('resumeChecker'); playSound('click'); }}
                    className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-rose-500/60 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                          📄
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full font-mono ${
                          isResumeDone 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                        }`}>
                          {isResumeDone ? `${latestAtsScore.score}/100` : '+50 XP'}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs group-hover:text-rose-600 transition">ATS Resume Scanner</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Upload PDF resume to get keyword score and Fortune 500 job matching.
                      </p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-rose-600 dark:text-rose-400">
                      <span>Audit Resume</span>
                      <span>➔</span>
                    </div>
                  </div>

                  {/* 6. Campus Drives & Alerts */}
                  <div 
                    onClick={() => { setActiveTab('drives'); playSound('click'); }}
                    className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                          📢
                        </div>
                        <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-1 rounded-full font-mono">
                          Live Drives
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs group-hover:text-emerald-600 transition">Campus Drives & Jobs</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Track upcoming company recruitment circulars, deadlines, and registration.
                      </p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span>View Drives</span>
                      <span>➔</span>
                    </div>
                  </div>

                  {/* 7. Company Eligibility */}
                  <div 
                    onClick={() => { setActiveTab('eligibility'); playSound('click'); }}
                    className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-teal-500/60 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                          🏢
                        </div>
                        <span className="text-[10px] font-black uppercase text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 border border-teal-300 dark:border-teal-500/30 px-2.5 py-1 rounded-full font-mono">
                          MNC Cutoffs
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs group-hover:text-teal-600 transition">Company Eligibility</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Check CGPA requirements, backlog limits, and eligible branches.
                      </p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-teal-600 dark:text-teal-400">
                      <span>Check Cutoffs</span>
                      <span>➔</span>
                    </div>
                  </div>

                  {/* 8. 1v1 Battle */}
                  <div 
                    onClick={() => { setActiveTab('1v1Battle'); playSound('click'); }}
                    className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-pink-500/60 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                          ⚔️
                        </div>
                        <span className="text-[10px] font-black uppercase text-pink-800 dark:text-pink-300 bg-pink-100 dark:bg-pink-950 border border-pink-300 dark:border-pink-500/30 px-2.5 py-1 rounded-full font-mono">
                          1v1 Duel
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs group-hover:text-pink-600 transition">1v1 Coding Battle</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Challenge friends or classmates in real-time speed coding duels.
                      </p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-pink-600 dark:text-pink-400">
                      <span>Enter Arena</span>
                      <span>➔</span>
                    </div>
                  </div>

                </div>

                {/* Secondary Quick Access Bar for Analytics, Leaderboard & Roadmap */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold shadow-md">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pl-1">
                    <span>🧭</span> Career Growth Navigation:
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setActiveTab('progress'); playSound('click'); }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
                    >
                      📈 Score Analytics
                    </button>
                    <button 
                      onClick={() => { setActiveTab('leaderboard'); playSound('click'); }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-600 transition cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
                    >
                      🏆 Campus Leaderboard
                    </button>
                    <button 
                      onClick={() => { setActiveTab('roadmap'); playSound('click'); }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-purple-600 transition cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
                    >
                      🗺️ AI Study Roadmap
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  INTERACTIVE TOPIC EXPLORER (SEARCH & FILTER 17 SUBJECTS)
                  ======================================================== */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📚</span> Topic & Subject Explorer
                    </h2>
                    <p className="text-xs text-slate-500">Pick any topic to start instant self-paced practice or launch a timed mock test</p>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search subject or keyword..."
                      value={topicSearch}
                      onChange={(e) => setTopicSearch(e.target.value)}
                      className="w-full px-3.5 py-2 pl-9 bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 shadow-inner"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
                    {topicSearch && (
                      <button onClick={() => setTopicSearch('')} className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600">✕</button>
                    )}
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 relative z-10 overflow-x-auto no-scrollbar touch-scroll pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
                  {[
                    { id: 'all', label: 'All Subjects (17)' },
                    { id: 'core', label: '💻 Core Computer Science' },
                    { id: 'coding', label: '⚡ Coding & Algorithms' },
                    { id: 'web', label: '🌐 Web, Cloud & Security' },
                    { id: 'aptitude', label: '🧠 Aptitude & AI' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setTopicFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        topicFilter === f.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Filtered Grid of Topics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1 relative z-10">
                  {filteredTopics.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-slate-500">
                      No subjects found matching "{topicSearch}". Try another search term.
                    </div>
                  ) : (
                    filteredTopics.map((subject) => {
                      const meta = MOCK_SUBJECT_META[subject];
                      return (
                        <div 
                          key={subject}
                          className="p-4 rounded-2xl bg-white/70 dark:bg-slate-950/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xl group-hover:scale-110 transition-transform">{meta.icon}</span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
                                {meta.count}+ Qs
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{subject}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {meta.desc}
                            </p>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                            <button
                              onClick={() => {
                                setSelectedCategory(subject);
                                setActiveTab('practice');
                                playSound('click');
                              }}
                              className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] border border-slate-200 dark:border-slate-700 transition cursor-pointer text-center"
                            >
                              ⚡ Practice
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCategory(subject);
                                setActiveTab('mockTests');
                                playSound('click');
                              }}
                              className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-sm transition cursor-pointer text-center"
                            >
                              📝 Mock Test
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ========================================================
                  PERFORMANCE SUMMARY & RECENT ASSESSMENT RECORDS
                  ======================================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Performance Trend SVG Curve (7 Cols) */}
                <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Performance Curve 📈
                      </h3>
                      <p className="text-xs text-slate-500">Historical score trajectory across completed assessments</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('progress')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Full Analytics →
                    </button>
                  </div>

                  {testHistory.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 relative z-10">
                      No test history recorded yet. Complete a test in the Mock Arena to render your curve!
                    </div>
                  ) : (
                    <div className="pt-2 relative z-10">
                      <div className="relative w-full overflow-x-auto">
                        <svg viewBox="0 0 600 180" className="w-full h-44 overflow-visible">
                          <line x1="30" y1="20" x2="580" y2="20" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                          <line x1="30" y1="70" x2="580" y2="70" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                          <line x1="30" y1="120" x2="580" y2="120" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1" />
                          <line x1="30" y1="150" x2="580" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                          
                          <text x="0" y="24" fill="#94a3b8" fontSize="10" fontWeight="bold">100%</text>
                          <text x="0" y="74" fill="#94a3b8" fontSize="10" fontWeight="bold">75%</text>
                          <text x="0" y="124" fill="#94a3b8" fontSize="10" fontWeight="bold">50%</text>

                          {(() => {
                            const recentTests = [...testHistory].slice(0, 8).reverse();
                            const count = recentTests.length;
                            if (count === 0) return null;
                            
                            const startX = 50;
                            const width = 500;
                            const step = count > 1 ? width / (count - 1) : 0;
                            
                            const points = recentTests.map((test, index) => {
                              const x = startX + (count === 1 ? width / 2 : index * step);
                              const pct = test.percentage || 0;
                              const y = 150 - (pct / 100) * 130;
                              return { x, y, test, pct };
                            });

                            const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

                            return (
                              <>
                                <defs>
                                  <linearGradient id="studentCurveGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>
                                
                                {count > 1 && (
                                  <polygon 
                                    points={`${points[0].x},150 ${points.map(p => `${p.x},${p.y}`).join(' ')} ${points[points.length-1].x},150`} 
                                    fill="url(#studentCurveGradient)" 
                                  />
                                )}

                                <polyline 
                                  fill="none" 
                                  stroke="#6366f1" 
                                  strokeWidth="3" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  points={polylinePoints} 
                                />

                                {points.map((p, i) => (
                                  <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                                    <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#6366f1" fontSize="9" fontWeight="bold">
                                      {p.pct}%
                                    </text>
                                  </g>
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Tests Records (5 Cols) */}
                <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="flex justify-between items-center relative z-10">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Recent Activity 📝
                    </h3>
                    <button 
                      onClick={() => setActiveTab('mockTests')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      New Test →
                    </button>
                  </div>

                  {testHistory.length === 0 ? (
                    <p className="text-slate-500 text-xs py-8 text-center relative z-10">No assessments completed yet.</p>
                  ) : (
                    <div className="space-y-2.5 relative z-10">
                      {testHistory.slice(0, 4).map((test) => (
                        <div key={test.id} className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xs flex justify-between items-center hover:border-indigo-500/40 transition">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-slate-900 dark:text-white text-xs block truncate">{test.category}</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{test.test_date} • {test.score}/{test.total}</p>
                          </div>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 font-mono ${
                            test.percentage >= 70 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                          }`}>
                            {test.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

          ) : activeTab === 'mockTests' ? (

            /* ========================================================
               CLEAN, VISUAL MOCK TEST CONFIGURATION VIEW
               ======================================================== */
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-slate-900 dark:text-white font-sans">
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full mb-1 border border-indigo-200 dark:border-indigo-500/30">
                    <span>⚡</span> Corporate Mock Test Arena
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Placement Assessment Setup
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                    Simulate real recruiter screening rounds with live proctored timers and instant scores.
                  </p>
                </div>

                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  ✕ Exit Setup
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Configuration Panel (2 Cols) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
                  
                  {/* Step 1: Subject Selection */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      1. Choose Target Subject
                    </label>

                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-indigo-300 dark:border-indigo-500/40 p-3.5 rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer appearance-none"
                      >
                        {allSubjectKeys.map((cat) => (
                          <option key={cat} value={cat}>
                            {MOCK_SUBJECT_META[cat]?.icon} {cat} ({MOCK_SUBJECT_META[cat]?.count}+ Qs)
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-500 font-bold">
                        ▼
                      </div>
                    </div>

                    {/* Preview Card of Selected Subject */}
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{MOCK_SUBJECT_META[selectedCategory]?.icon || '📚'}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{selectedCategory}</p>
                          <p className="text-[10px] text-slate-500 truncate">{MOCK_SUBJECT_META[selectedCategory]?.desc}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg shrink-0">
                        {MOCK_SUBJECT_META[selectedCategory]?.count || 100}+ Qs
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Difficulty Tier */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      2. Difficulty Tier
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'all', label: '🎯 Adaptive (All)', sub: 'Mixed pool' },
                        { id: 'Easy', label: '🟢 Fundamental', sub: 'Concepts' },
                        { id: 'Medium', label: '🟡 Core Tech', sub: 'Standard' },
                        { id: 'Hard', label: '🔴 Advanced', sub: 'Complex' }
                      ].map((diff) => (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => setSelectedDifficulty(diff.id)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            selectedDifficulty === diff.id
                              ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-white font-bold'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="text-xs block">{diff.label}</span>
                          <span className="text-[9px] opacity-75 block">{diff.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Question Count & Timer */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      3. Assessment Duration & Length
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { count: 5, time: '5 Mins', label: '⚡ Sprint' },
                        { count: 10, time: '10 Mins', label: '🎯 Standard' },
                        { count: 20, time: '20 Mins', label: '🔥 Advanced' },
                        { count: 50, time: '50 Mins', label: '🏆 Marathon' }
                      ].map((item) => (
                        <button
                          key={item.count}
                          type="button"
                          onClick={() => setQuestionCount(item.count)}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            questionCount === item.count
                              ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-md'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="block text-xs">{item.label}</span>
                          <span className="block text-sm font-black">{item.count} Qs</span>
                          <span className="block text-[10px] opacity-75">⏱ {item.time}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Launch Assessment CTA */}
                  <button 
                    onClick={() => handleStartTest()} 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm py-4 rounded-2xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Fetching Questions...' : `Launch ${selectedCategory} Assessment (${questionCount} Qs) ➔`}</span>
                  </button>
                </div>

                {/* Exam Guidelines HUD (1 Col) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                      📋 Assessment Guidelines
                    </h3>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-white block mb-0.5">⏱ 1 Minute Per Question</strong>
                        Auto-submits when countdown expires.
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-white block mb-0.5">🚩 Flag Questions</strong>
                        Review doubtful questions before final submission.
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-white block mb-0.5">🏆 Instant Grading</strong>
                        Scores update your college rank and progression curve.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-center text-xs">
                    <p className="font-bold text-indigo-900 dark:text-indigo-300">Ready to test?</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">2,052+ active questions in pool</p>
                  </div>
                </div>

              </div>
            </div>

          ) : activeTab === 'practice' ? (
            <PracticeMode userEmail={userEmail} onBack={() => setActiveTab('dashboard')} initialCategory={selectedCategory} />
          ) : activeTab === 'codingArena' ? (
            <CodingArena userEmail={userEmail} userName={user?.name || 'Student'} onBack={() => setActiveTab('dashboard')} />
          ) : activeTab === 'resumeChecker' ? (
            <ResumeChecker userEmail={userEmail} onBack={() => setActiveTab('dashboard')} />
          ) : activeTab === 'aiInterview' ? (
            <AIInterviewSimulator userEmail={userEmail} onBack={() => setActiveTab('dashboard')} />
          ) : activeTab === 'eligibility' ? (
            <CompanyEligibilityChecker userEmail={userEmail} onBack={() => setActiveTab('dashboard')} />
          ) : activeTab === 'drives' ? (
            <PlacementDrivesHub 
              userEmail={userEmail} 
              userName={user?.name || 'Student'} 
              userRole={user?.role || 'student'} 
              userAddress={user?.address || ''} 
              userHometown={user?.hometown || ''} 
              onBack={() => setActiveTab('dashboard')}   
            />
          ) : activeTab === 'progress' ? (
            <div className="space-y-6">
              <UserProgressGraph 
                student={user} 
                testRecords={testHistory} 
                interviewRecords={interviewHistory} 
                codingRecords={codingHistory} 
              />
            </div>
          ) : activeTab === 'leaderboard' ? (
            <Leaderboard userEmail={userEmail} onBack={() => setActiveTab('dashboard')} />
          ) : activeTab === 'roadmap' ? (
            <PlacementRoadmap userEmail={userEmail} onBack={() => setActiveTab('dashboard')} />
          ) : activeTab === '1v1Battle' ? (
            <Live1v1Battle userName={user?.name || 'Student'} onBack={() => setActiveTab('dashboard')} />
          ) : null}

        </main>
      </div>

      {/* Global Streak & Certificate Modals */}
      <StreakModal 
        isOpen={showStreakModal} 
        onClose={() => setShowStreakModal(false)} 
      />
      <PlacementCertificateModal 
        isOpen={showCertModal} 
        onClose={() => setShowCertModal(false)} 
        student={user} 
        readinessIndex={Math.min(95, 45 + (testHistory.length * 5) + (codingHistory.length * 5))} 
      />
    </div>
  );
}