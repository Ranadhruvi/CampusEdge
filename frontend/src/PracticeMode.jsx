import { streakManager } from './streakManager';
import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { useToast } from './Toast';
import TwoStepExitModal from './TwoStepExitModal';
import FullscreenBarrierModal from './FullscreenBarrierModal';
import DisqualificationModal from './DisqualificationModal';
import { 
  playProctorAlertChime, 
  requestNotificationPermission, 
  sendSystemProctorNotification, 
  enterFullscreenMode, 
  exitFullscreenMode 
} from './proctorUtils';

const SUBJECT_METADATA = {
  "Database Management & SQL": { icon: "🗄️", desc: "ACID, B+ Trees, Normalization, Window Functions & SQL Queries", color: "from-emerald-500 to-teal-600" },
  "Operating Systems": { icon: "💻", desc: "Deadlocks, Paging, Inodes, Mutex vs Semaphore & CPU Scheduling", color: "from-purple-500 to-indigo-600" },
  "Computer Networks": { icon: "🌐", desc: "OSI 7 Layers, TCP Handshake, DNS, HTTP/3, TLS & Subnetting", color: "from-cyan-500 to-blue-600" },
  "Data Structures & Algorithms": { icon: "⚡", desc: "Segment Trees, Dynamic Programming, Graphs, Heaps & Bitwise", color: "from-blue-500 to-indigo-600" },
  "Aptitude & Logical Reasoning": { icon: "🧠", desc: "Speed & Distance, Profit/Loss, Probability & Syllogisms", color: "from-amber-500 to-orange-600" },
  "React & Modern Frontend": { icon: "⚛️", desc: "React Fiber, Hooks, SSR vs SSG, Virtual DOM & State Management", color: "from-sky-500 to-indigo-500" },
  "OOP & Design Patterns": { icon: "📐", desc: "SOLID Principles, Factory, Strategy, Decorator & Facade", color: "from-rose-500 to-pink-600" },
  "Python": { icon: "🐍", desc: "Data Structures, Generators, Dunder Methods, OOP & Standard Library", color: "from-green-500 to-emerald-600" },
  "Python & Backend": { icon: "⚙️", desc: "FastAPI, Celery, SQLAlchemy, AsyncIO, WSGI/ASGI & API Design", color: "from-teal-500 to-emerald-600" },
  "Java": { icon: "☕", desc: "JVM Memory Model, Garbage Collection, Multi-threading & Collections", color: "from-orange-500 to-amber-600" },
  "JavaScript": { icon: "🟨", desc: "ES6+, Event Loop, Microtasks, Closures, Promises & Async/Await", color: "from-yellow-500 to-amber-500" },
  "HTML": { icon: "🌐", desc: "Semantic Elements, Web Workers, Canvas, ARIA, Shadow DOM & Meta", color: "from-orange-400 to-rose-500" },
  "System Design & Architecture": { icon: "🏗️", desc: "Scalability, Caching, CAP Theorem, Sharding, Kafka & Microservices", color: "from-indigo-500 to-purple-600" },
  "Cyber Security & Auth": { icon: "🛡️", desc: "SQLi, XSS, CSRF, SSRF, PKCE, JWT & Password Hashing", color: "from-red-500 to-rose-600" },
  "Cloud & DevOps": { icon: "☁️", desc: "Docker Multi-Stage, Kubernetes Pods/PVCs, CI/CD & Terraform", color: "from-indigo-500 to-violet-600" },
  "Machine Learning & AI": { icon: "🤖", desc: "Transformers, Self-Attention, Regularization, Neural Nets & PCA", color: "from-fuchsia-500 to-purple-600" },
  "C++ & Low Level Systems": { icon: "⚡", desc: "C++20 Concepts, Move Semantics, RAII, Vtables & Memory Layout", color: "from-slate-500 to-slate-700" }
};

export default function PracticeMode({ userEmail, onBack, initialCategory }) {
  const [viewMode, setViewMode] = useState('select'); // 'select', 'practice', 'history'
  const [displayLayout, setDisplayLayout] = useState('dropdown'); // 'dropdown' or 'cards'
  const [practiceType, setPracticeType] = useState('mcq'); // 'mcq' (Quiz with options) or 'flashcard' (Read question & reveal answer)
  const [selectedDifficulty, setSelectedDifficulty] = useState('all'); // 'all', 'Easy', 'Medium', 'Hard'
  
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dropdownCategory, setDropdownCategory] = useState(initialCategory || 'Database Management & SQL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false); // For Flashcard / Study mode
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Zero-Repeat State & Category Progress
  const [totalCategoryQuestions, setTotalCategoryQuestions] = useState(100);
  const [seenCount, setSeenCount] = useState(0);
  const [allQuestionsCompletedAlert, setAllQuestionsCompletedAlert] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  // Track student's answers for history review
  const [sessionAnswers, setSessionAnswers] = useState([]);

  // Practice History State
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Anti-Cheat & Tab Switch Proctoring State
  const [tabSwitches, setTabSwitches] = useState(0);
  const [tabSwitchLogs, setTabSwitchLogs] = useState([]);
  const [showTabWarningModal, setShowTabWarningModal] = useState(false);
  const [lastViolationTime, setLastViolationTime] = useState(null);
  const lastViolationRef = React.useRef(0);
  const wasAwayRef = React.useRef(false);
  const tabSwitchesRef = React.useRef(0);

  // Fullscreen & Two-Step Exit & Disqualification State
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [showFullscreenBarrier, setShowFullscreenBarrier] = useState(false);
  const [showTwoStepExitModal, setShowTwoStepExitModal] = useState(false);
  const [showDisqualificationModal, setShowDisqualificationModal] = useState(false);

  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Prevent leaving or reloading during active practice session
  useEffect(() => {
    if (viewMode !== 'practice' || submitting) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Practice session is in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [viewMode, submitting]);

  const handleAutoDisqualifyPractice = async (switchesCount, currentLogs) => {
    setSubmitting(true);
    playProctorAlertChime();
    exitFullscreenMode().catch(() => {});
    setShowTabWarningModal(false);
    setShowDisqualificationModal(true);

    const payload = {
      email: userEmail,
      category: `${selectedCategory} (DISQUALIFIED - 3 Tab Violations)`,
      score: score,
      total: questions.length,
      percentage: Math.round((score / (questions.length || 1)) * 100),
      test_date: new Date().toLocaleDateString(),
      tab_switches: switchesCount,
      fullData: { 
        coveredQuestions: sessionAnswers,
        practiceMode: practiceType,
        difficulty: selectedDifficulty,
        tabSwitches: switchesCount,
        tabSwitchLogs: currentLogs,
        isDisqualified: true,
        disqualificationReason: "Exceeded 3 tab switches in practice exam"
      }
    };

    if (userEmail && userEmail !== 'default@student.com') {
      try {
        await apiFetch('/api/questions/save-history', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed to save disqualified practice history:", err);
      }
    }

    setSubmitting(false);
  };

  // Tab Switch & Visibility Change Detection in Practice Mode
  const resetAwayTimeoutRef = React.useRef(null);

  useEffect(() => {
    if (viewMode !== 'practice' || submitting) return;

    const originalTitle = document.title;

    const triggerViolation = (type) => {
      const now = Date.now();
      if (wasAwayRef.current || (now - lastViolationRef.current < 2500)) return;
      wasAwayRef.current = true;
      lastViolationRef.current = now;
      if (resetAwayTimeoutRef.current) clearTimeout(resetAwayTimeoutRef.current);

      const timeString = new Date().toLocaleTimeString();
      const nextCount = tabSwitchesRef.current + 1;
      tabSwitchesRef.current = nextCount;

      const logEntry = {
        timestamp: timeString,
        type: type,
        warningNumber: nextCount,
        message: `Candidate left examination window (${type})`
      };

      setTabSwitches(nextCount);
      setTabSwitchLogs(prevLogs => {
        const updatedLogs = [...prevLogs, logEntry];
        if (nextCount >= 3) {
          sendSystemProctorNotification(
            "🚨 Practice Session Terminated - 3 Violations!", 
            `You exceeded 3 tab switches. Your round has been terminated and auto-saved.`
          );
          document.title = `🚨 [DISQUALIFIED] Practice Terminated!`;
          handleAutoDisqualifyPractice(nextCount, updatedLogs);
        }
        return updatedLogs;
      });
      setLastViolationTime(timeString);
      playProctorAlertChime();

      if (nextCount < 3) {
        setShowTabWarningModal(true);
        sendSystemProctorNotification(
          "⚠️ Proctoring Warning!", 
          `Tab switch detected at ${timeString}. Warning ${nextCount} of 3! Return immediately.`
        );
        showWarning(`⚠️ Proctoring Warning: Tab switch / window blur detected! (Warning ${nextCount} of 3)`);
        document.title = `⚠️ [PROCTOR WARNING ${nextCount}/3] Return to Practice!`;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerViolation('Tab Switched / Hidden');
      } else {
        if (resetAwayTimeoutRef.current) clearTimeout(resetAwayTimeoutRef.current);
        resetAwayTimeoutRef.current = setTimeout(() => {
          wasAwayRef.current = false;
        }, 1500);
      }
    };

    const handleBlur = () => {
      triggerViolation('Window Unfocused / App Switched');
    };

    const handleFocus = () => {
      if (resetAwayTimeoutRef.current) clearTimeout(resetAwayTimeoutRef.current);
      resetAwayTimeoutRef.current = setTimeout(() => {
        wasAwayRef.current = false;
      }, 1500);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      if (resetAwayTimeoutRef.current) clearTimeout(resetAwayTimeoutRef.current);
      document.title = originalTitle;
    };
  }, [viewMode, submitting]);

  // Fullscreen monitor in practice mode
  useEffect(() => {
    if (viewMode !== 'practice') {
      setShowFullscreenBarrier(false);
      return;
    }

    const handleFSChange = () => {
      const inFS = Boolean(document.fullscreenElement);
      setIsFullscreen(inFS);
      if (!inFS && viewMode === 'practice' && !submitting) {
        setShowFullscreenBarrier(true);
      } else {
        setShowFullscreenBarrier(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
    };
  }, [viewMode, submitting]);

  const handleReEnterFullscreen = async () => {
    await enterFullscreenMode();
    setShowFullscreenBarrier(false);
  };

  // Helper to get seen IDs for a category
  const getSeenIdsForCategory = (cat, diff) => {
    try {
      const key = `campusedge_seen_q_${encodeURIComponent(cat)}_${diff}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveSeenIdsForCategory = (cat, diff, newIds) => {
    try {
      const key = `campusedge_seen_q_${encodeURIComponent(cat)}_${diff}`;
      const current = getSeenIdsForCategory(cat, diff);
      const combined = [...new Set([...current, ...newIds])];
      localStorage.setItem(key, JSON.stringify(combined));
      setSeenCount(combined.length);
    } catch (err) {
      console.warn("Error storing seen question IDs:", err);
    }
  };

  const handleResetCategoryProgress = (cat) => {
    const key = `campusedge_seen_q_${encodeURIComponent(cat)}_${selectedDifficulty}`;
    localStorage.removeItem(key);
    setSeenCount(0);
    setAllQuestionsCompletedAlert(false);
    showSuccess(`Reset question queue for ${cat}! You can practice all questions again from scratch.`);
    fetchQuestionsForCategory(cat, true);
  };

  // Fetch available categories dynamically from database
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await apiFetch('/api/questions');
        if (res.ok) {
          const data = await res.json();
          const allQuestions = data.questions || data;
          if (Array.isArray(allQuestions) && allQuestions.length > 0) {
            const counts = {};
            allQuestions.forEach(q => {
              const cat = q.category || q.tag;
              if (cat) counts[cat] = (counts[cat] || 0) + 1;
            });
            setCategoryCounts(counts);

            const uniqueCats = Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
            setCategories(uniqueCats);
            if (uniqueCats.length > 0 && !dropdownCategory) {
              setDropdownCategory(uniqueCats[0]);
            }
          } else {
            setCategories(Object.keys(SUBJECT_METADATA));
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setCategories(Object.keys(SUBJECT_METADATA));
      }
      setLoadingCategories(false);
    };

    fetchCategories();
  }, []);

  const fetchPracticeHistory = async () => {
    if (!userEmail || userEmail === 'default@student.com') return;
    setLoadingHistory(true);
    try {
      const res = await apiFetch(`/api/questions/history/${userEmail}`);
      if (res.ok) {
        const data = await res.json();
        
        const normalized = data.map(item => ({
          ...item,
          parsedData: typeof item.full_data === 'string' 
            ? JSON.parse(item.full_data) 
            : (item.full_data || item.fullData || {})
        }));

        const practiceOnly = normalized.filter(item => 
          (item.category && item.category.toLowerCase().includes('practice')) ||
          (item.parsedData && item.parsedData.coveredQuestions && item.parsedData.coveredQuestions.length > 0)
        );

        setPracticeHistory(practiceOnly);
      }
    } catch (err) {
      console.error("Error fetching practice history:", err);
    }
    setLoadingHistory(false);
  };

  const fetchQuestionsForCategory = async (cat, isForcedReset = false) => {
    setLoading(true);
    setAllQuestionsCompletedAlert(false);
    try {
      const seenIds = isForcedReset ? [] : getSeenIdsForCategory(cat, selectedDifficulty);
      setSeenCount(seenIds.length);
      
      const encodedCat = encodeURIComponent(cat.trim());
      const excludeParam = seenIds.length > 0 ? `&excludeIds=${seenIds.join(',')}` : '';
      const diffParam = selectedDifficulty !== 'all' ? `&difficulty=${encodeURIComponent(selectedDifficulty)}` : '';
      
      const res = await apiFetch(`/api/questions/practice-questions?category=${encodedCat}&limit=10${diffParam}${excludeParam}`);
      
      if (res.ok) {
        const data = await res.json();
        const questionList = data.questions || [];
        setQuestions(questionList);
        setTotalCategoryQuestions(data.totalInCategory || 100);

        if (data.isReset) {
          setAllQuestionsCompletedAlert(true);
          showInfo(`🎉 You have completed all questions in ${cat} (${selectedDifficulty})! Restarting question loop with mastery review.`);
        }
      } else {
        setQuestions([]);
        showError(`Could not load questions for ${cat}.`);
      }
    } catch (err) {
      console.error("Error fetching questions for category:", err);
      setQuestions([]);
      showError(`Error connecting to question database.`);
    }
    setLoading(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsAnswerRevealed(false);
    setSessionAnswers([]);
  };

  const handleStartCategory = (cat, type = 'mcq') => {
    setSelectedCategory(cat);
    setPracticeType(type);
    setViewMode('practice');
    enterFullscreenMode().then((success) => {
      if (success) setIsFullscreen(true);
    });
    fetchQuestionsForCategory(cat);
  };

  const handleOptionClick = (opt) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const currentQuestion = questions[currentIndex];
    const correct = currentQuestion?.correctAnswer || currentQuestion?.answer;
    const isCorrect = opt === correct;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Mark ONLY this answered question as seen
    if (currentQuestion?.id) {
      saveSeenIdsForCategory(selectedCategory, selectedDifficulty, [currentQuestion.id]);
    }

    setSessionAnswers(prev => [
      ...prev,
      {
        question: currentQuestion.question || currentQuestion.text,
        selected: opt,
        correct: correct,
        isCorrect: isCorrect,
        explanation: currentQuestion.explanation,
        difficulty: currentQuestion.difficulty
      }
    ]);
  };

  const handleRevealSolution = () => {
    setIsAnswerRevealed(true);
    const currentQuestion = questions[currentIndex];
    if (currentQuestion?.id) {
      saveSeenIdsForCategory(selectedCategory, selectedDifficulty, [currentQuestion.id]);
    }
  };

  const handleExitPractice = () => {
    setShowTwoStepExitModal(true);
  };

  const handleConfirmForfeitPractice = () => {
    setShowTwoStepExitModal(false);
    exitFullscreenMode().catch(() => {});
    setSelectedCategory(null);
    setViewMode('select');
  };

  const handleNext = async () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setIsAnswerRevealed(false);
    
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSubmitting(true);
      const finalScore = score;
      const totalQuestions = questions.length;
      const percentage = Math.round((finalScore / totalQuestions) * 100);
      const currentDate = new Date().toLocaleDateString();

      const payload = {
        email: userEmail,
        category: `${selectedCategory} (Practice - ${practiceType === 'mcq' ? 'MCQ' : 'Study Mode'})`,
        score: finalScore,
        total: totalQuestions,
        percentage: percentage,
        test_date: currentDate,
        tab_switches: tabSwitches,
        fullData: { 
          coveredQuestions: sessionAnswers,
          practiceMode: practiceType,
          difficulty: selectedDifficulty,
          tabSwitches: tabSwitches,
          tabSwitchLogs: tabSwitchLogs
        }
      };

      if (!userEmail || userEmail !== 'default@student.com') {
        try {
          await apiFetch('/api/questions/save-history', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
        } catch (err) {
          console.error("Failed to save practice history:", err);
        }
      }

      setSubmitting(false);
      streakManager.recordActivity({
        type: 'practice',
        xp: 100,
        coins: 20,
        title: `Completed Practice: ${selectedCategory} (${finalScore}/${totalQuestions})`
      });
      showSuccess(`Round complete! ${practiceType === 'mcq' ? `Score: ${finalScore}/${totalQuestions} (${percentage}%)` : '10 concepts mastered!'}`);
      exitFullscreenMode();
      setIsFullscreenBarrierOpen(false);
      setSelectedCategory(null);
      setViewMode('select');
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (SUBJECT_METADATA[cat]?.desc || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 1. Hub / Subject Selection View
  if (viewMode === 'select' && !selectedCategory) {
    const activeMeta = SUBJECT_METADATA[dropdownCategory] || { icon: "📚", desc: "Technical interview question bank", color: "from-indigo-500 to-purple-600" };
    const dropdownTotalCount = categoryCounts[dropdownCategory] || 100;
    const dropdownSeenCount = getSeenIdsForCategory(dropdownCategory, selectedDifficulty).length;
    const dropdownProgressPct = Math.min(100, Math.round((dropdownSeenCount / dropdownTotalCount) * 100));

    return (
      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans animate-fade-in space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3.5 py-1.5 rounded-full">
              <span>🎯</span> Subject Practice Arena &bull; Zero-Repeat Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">Interactive Question Drilling</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Practice fresh questions every round with instant explanations and difficulty filters.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* View Switcher (Dropdown vs Cards) */}
            <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex text-xs font-bold">
              <button
                onClick={() => setDisplayLayout('dropdown')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  displayLayout === 'dropdown' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Sleek Dropdown Selector"
              >
                <span>📑</span> Dropdown View
              </button>
              <button
                onClick={() => setDisplayLayout('cards')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  displayLayout === 'cards' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Visual Subject Cards Grid"
              >
                <span>🗂️</span> Cards Grid
              </button>
            </div>

            <button 
              onClick={() => { setViewMode('history'); fetchPracticeHistory(); }}
              className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-500/30 px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
            >
              📊 History
            </button>
            <button 
              onClick={onBack} 
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl transition cursor-pointer border border-slate-200 dark:border-transparent"
            >
              ✕ Exit
            </button>
          </div>
        </div>

        {/* Global Difficulty Tier Selector */}
        <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
              Filter By Difficulty Tier:
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Target specific technical depth for this practice session</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
            {[
              { id: 'all', label: '🎯 All Levels' },
              { id: 'Easy', label: '🟢 Fundamental' },
              { id: 'Medium', label: '🟡 Core Technical' },
              { id: 'Hard', label: '🔴 Advanced' }
            ].map((diff) => (
              <button
                key={diff.id}
                type="button"
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                  selectedDifficulty === diff.id
                    ? 'bg-indigo-600 border border-indigo-400 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        {/* VIEW 1: SLEEK CUSTOM DROPDOWN VIEW */}
        {displayLayout === 'dropdown' ? (
          <div className="bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                Select Subject from Dropdown:
              </label>

              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={dropdownCategory}
                    onChange={(e) => setDropdownCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-500/50 hover:border-indigo-400 p-4 pr-10 rounded-2xl text-slate-900 dark:text-white font-bold text-sm sm:text-base outline-none focus:ring-2 focus:ring-indigo-500/30 transition cursor-pointer appearance-none shadow-md"
                  >
                    {categories.map((cat) => {
                      const count = categoryCounts[cat] || 100;
                      return (
                        <option key={cat} value={cat} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-2">
                          {cat} ({count}+ Questions)
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 font-bold">
                    ▼
                  </div>
                </div>

                {/* Live Selected Subject Preview Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                      {activeMeta.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-white truncate block">
                          {dropdownCategory}
                        </span>
                        <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-md flex-shrink-0">
                          {dropdownTotalCount}+ Qs
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                        {activeMeta.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Subject Overview & Mastery Stats */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Coverage in {dropdownCategory} ({selectedDifficulty === 'all' ? 'All Difficulties' : selectedDifficulty}):</span>
                <span className={dropdownProgressPct === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}>
                  {dropdownSeenCount}/{dropdownTotalCount} ({dropdownProgressPct}%)
                </span>
              </div>
              
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${dropdownProgressPct}%` }}
                ></div>
              </div>

              {dropdownSeenCount > 0 && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleResetCategoryProgress(dropdownCategory)}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    🔄 Reset Question Queue for {dropdownCategory}
                  </button>
                </div>
              )}
            </div>

            {/* Launch Practice Choice Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleStartCategory(dropdownCategory, 'mcq')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-5 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/30 transition cursor-pointer flex flex-col items-center justify-center gap-1 group transform hover:-translate-y-0.5"
              >
                <span className="text-base">🧠 Start Interactive MCQ Quiz</span>
                <span className="text-[11px] font-medium opacity-90">4 Multiple Choice Options &bull; Instant Scoring</span>
              </button>

              <button
                onClick={() => handleStartCategory(dropdownCategory, 'flashcard')}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 p-5 rounded-2xl font-black text-sm transition cursor-pointer flex flex-col items-center justify-center gap-1 group transform hover:-translate-y-0.5 shadow-sm"
              >
                <span className="text-base">📖 Start Concept Study Mode</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Read Scenario &bull; Reveal Solution & Explanation</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: VISUAL CARDS GRID */
          <div className="space-y-4">
            <div className="mb-4">
              <input 
                type="text"
                placeholder="🔍 Search subject (e.g. DBMS, Operating Systems, React, Python, DSA, Networks)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => {
                const meta = SUBJECT_METADATA[cat] || { icon: "📚", desc: "Drill verified questions with instant explanation feedback.", color: "from-indigo-500 to-purple-600" };
                const totalCount = categoryCounts[cat] || 100;
                const seen = getSeenIdsForCategory(cat, selectedDifficulty).length;
                const progressPct = Math.min(100, Math.round((seen / totalCount) * 100));

                return (
                  <div
                    key={cat}
                    className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/80 hover:border-indigo-500/80 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-all duration-300 shadow-sm hover:shadow-xl group flex flex-col justify-between glass-card-hover"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                          {meta.icon}
                        </div>
                        <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-1 rounded-lg">
                          {totalCount} Questions
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {cat}
                      </h3>
                      
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-3">
                        {meta.desc}
                      </p>

                      <div className="mb-4 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          <span>Coverage: {seen}/{totalCount}</span>
                          <span className={progressPct === 100 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-indigo-600 dark:text-indigo-400 font-bold"}>
                            {progressPct}% {progressPct === 100 && "✓ Mastered"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStartCategory(cat, 'mcq')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl text-[11px] font-bold shadow-sm transition cursor-pointer text-center flex flex-col items-center justify-center"
                        >
                          <span>🧠 MCQ Quiz</span>
                          <span className="text-[9px] font-medium opacity-90">Test & Score</span>
                        </button>

                        <button
                          onClick={() => handleStartCategory(cat, 'flashcard')}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-[11px] font-bold transition cursor-pointer text-center flex flex-col items-center justify-center shadow-2xs"
                        >
                          <span>📖 Study</span>
                          <span className="text-[9px] font-medium opacity-90">Flashcard</span>
                        </button>
                      </div>

                      {seen > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResetCategoryProgress(cat); }}
                          className="w-full text-[10px] font-semibold text-slate-500 hover:text-rose-400 py-1 transition text-center cursor-pointer"
                        >
                          🔄 Reset Queue
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Practice History View
  if (viewMode === 'history') {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3.5 py-1.5 rounded-full">
              Student Records
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">Practice History & Concepts</h2>
          </div>
          <button 
            onClick={() => { setViewMode('select'); setSelectedHistoryItem(null); }}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            ← Back to Practice Hub
          </button>
        </div>

        {selectedHistoryItem ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedHistoryItem.category}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Completed on {selectedHistoryItem.test_date} | Score: {selectedHistoryItem.score}/{selectedHistoryItem.total} ({selectedHistoryItem.percentage}%)</p>
              </div>
              <button 
                onClick={() => setSelectedHistoryItem(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                ← Back
              </button>
            </div>

            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Session Questions & Concepts:</h4>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {selectedHistoryItem.parsedData?.coveredQuestions?.length > 0 ? (
                selectedHistoryItem.parsedData.coveredQuestions.map((q, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${q.isCorrect ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20' : 'border-rose-300 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/20'} space-y-1.5 text-xs`}>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">Question {idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${q.isCorrect ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'}`}>
                        {q.isCorrect ? 'Correct ✓' : 'Incorrect ✕'}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{q.question}</p>
                    <p className="text-slate-700 dark:text-slate-300">Your Answer: <span className={q.isCorrect ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-rose-700 dark:text-rose-400 font-bold'}>{q.selected}</span></p>
                    {!q.isCorrect && <p className="text-emerald-700 dark:text-emerald-400 font-bold">Correct Answer: {q.correct}</p>}
                    {q.explanation && (
                      <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                        <strong className="text-indigo-600 dark:text-indigo-400">Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs italic py-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">No breakdown stored for this practice record.</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {loadingHistory ? (
              <div className="py-16 text-center">
                <p className="text-slate-500 font-bold text-xs animate-pulse">Loading practice history...</p>
              </div>
            ) : practiceHistory.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <p className="font-bold text-sm mb-1 text-slate-900 dark:text-white">No practice sessions found yet.</p>
                <p>Complete a practice session from the hub to track your covered topics here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {practiceHistory.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shadow-xs hover:border-indigo-500/50 transition">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.category}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Date: <strong className="text-slate-700 dark:text-slate-300">{item.test_date}</strong> | Score: <strong className="text-indigo-600 dark:text-indigo-400">{item.score}/{item.total}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-xl font-bold text-xs ${item.percentage >= 70 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'}`}>
                        {item.percentage}%
                      </span>
                      <button 
                        onClick={() => setSelectedHistoryItem(item)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
                      >
                        Breakdown →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // 3. Loading State
  if (loading || submitting) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-16 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center text-slate-900 dark:text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-bold text-sm">{submitting ? 'Saving practice record...' : `Loading unpracticed ${selectedCategory} questions (${selectedDifficulty === 'all' ? 'All Tiers' : selectedDifficulty})...`}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center text-slate-900 dark:text-white">
        <h3 className="text-lg font-bold mb-2">No Questions Available</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">No questions found for <strong className="text-slate-900 dark:text-white">{selectedCategory}</strong> ({selectedDifficulty}).</p>
        <button
          onClick={() => { setSelectedCategory(null); setViewMode('select'); }}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-500 transition cursor-pointer shadow-md"
        >
          ← Choose Another Subject
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  // 4. Active Question View (MCQ Mode OR Flashcard Study Mode)
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans animate-fade-in">
      
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full">
              {practiceType === 'mcq' ? '🧠 MCQ Quiz Mode' : '📖 Read & Study Flashcard Mode'}
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              • {selectedCategory}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1.5">
            Question {currentIndex + 1} of {questions.length}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Proctoring Status Pill */}
          <div 
            className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-xs transition-all ${
              tabSwitches === 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                : tabSwitches <= 2 
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/50 animate-pulse' 
                : 'bg-rose-50 dark:bg-rose-950/90 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/60 animate-pulse ring-2 ring-rose-500/50'
            }`}
            title="Proctoring System: Tracks tab switches during practice"
          >
            <span>{tabSwitches === 0 ? '🛡️' : '⚠️'}</span>
            <span>{tabSwitches === 0 ? 'Proctor Clean' : `${tabSwitches} ${tabSwitches === 1 ? 'Tab Switch' : 'Tab Switches'}`}</span>
          </div>

          <button
            onClick={() => {
              setPracticeType(practiceType === 'mcq' ? 'flashcard' : 'mcq');
              setIsAnswerRevealed(false);
            }}
            className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl transition cursor-pointer"
            title="Switch between Quiz and Flashcard Study modes"
          >
            {practiceType === 'mcq' ? 'Switch to 📖 Study Mode' : 'Switch to 🧠 MCQ Quiz'}
          </button>
          
          <button 
            onClick={handleExitPractice}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 transition"
          >
            ← Change Subject
          </button>
        </div>
      </div>

      {/* Progress & Category Coverage Stats */}
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <span>Round Progress: </span>
          <strong className="text-indigo-600 dark:text-indigo-400">{currentIndex + 1}/{questions.length}</strong>
        </div>

        <div>
          <span>Total {selectedCategory} Mastered: </span>
          <strong className="text-emerald-600 dark:text-emerald-400">{seenCount}/{totalCategoryQuestions}</strong>
        </div>

        {practiceType === 'mcq' && (
          <div>
            <span>Correct: </span>
            <strong className="text-emerald-600 dark:text-emerald-400">{score}</strong>
          </div>
        )}
      </div>

      {/* QUESTION CONTENT */}
      {currentQuestion && (
        <div className="mb-6">
          <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2.5 py-0.5 rounded-md mb-3 uppercase tracking-wider">
            Difficulty: {currentQuestion.difficulty || selectedDifficulty}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">
            {currentQuestion.question || currentQuestion.text}
          </h3>

          {/* MODE 1: MCQ OPTIONS */}
          {practiceType === 'mcq' && (
            <div className="space-y-3">
              {(currentQuestion.options || []).map((opt, idx) => {
                let optionStyle = "border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/60";
                
                if (isAnswered) {
                  const correctAns = currentQuestion.correctAnswer || currentQuestion.answer;
                  if (opt === correctAns) {
                    optionStyle = "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm";
                  } else if (opt === selectedOption) {
                    optionStyle = "border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold shadow-sm";
                  } else {
                    optionStyle = "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-40 bg-slate-50 dark:bg-slate-950";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(opt)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-2xl border transition-all text-xs sm:text-sm font-semibold flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span><b>{String.fromCharCode(65 + idx)}:</b> {opt}</span>
                    {isAnswered && opt === (currentQuestion.correctAnswer || currentQuestion.answer) && (
                      <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-500/30">Correct ✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* MODE 2: FLASHCARD STUDY & REVEAL MODE */}
          {practiceType === 'flashcard' && (
            <div className="space-y-4">
              {!isAnswerRevealed ? (
                <button
                  onClick={handleRevealSolution}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white p-5 rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>👁️ Reveal Solution & Detailed Concept Explanation</span>
                </button>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/40 space-y-4 animate-fade-in">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Correct Answer</span>
                    <p className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                      ✓ {currentQuestion.correctAnswer || currentQuestion.answer}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Technical Deep Dive & Explanation</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-1">
                      {currentQuestion.explanation || "Review the key answer highlighted above."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EXPLANATION IN MCQ MODE */}
      {practiceType === 'mcq' && isAnswered && currentQuestion && (
        <div className="mb-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 animate-fade-in">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
            <span>💡</span> Explanation & Key Takeaway
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {currentQuestion.explanation || "The correct option is highlighted above. Review this concept to build technical mastery."}
          </p>
        </div>
      )}

      {/* NEXT / NAVIGATION ACTION */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(prev => prev - 1);
              setSelectedOption(null);
              setIsAnswered(false);
              setIsAnswerRevealed(false);
            }
          }}
          disabled={currentIndex === 0}
          className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition cursor-pointer px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          ← Previous
        </button>

        {(isAnswered || practiceType === 'flashcard') && (
          <button
            onClick={handleNext}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition shadow-md cursor-pointer text-xs sm:text-sm"
          >
            {currentIndex + 1 === questions.length ? 'Finish & Save Round →' : 'Next Question →'}
          </button>
        )}
      </div>

      {/* LIVE PROCTORING TAB SWITCH WARNING MODAL */}
      {showTabWarningModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-rose-500 text-slate-900 dark:text-white text-center space-y-5 animate-scale-up relative">
            
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-400 text-3xl flex items-center justify-center mx-auto shadow-inner animate-bounce">
              ⚠️
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 px-3 py-1 rounded-full">
                Proctoring Violation #{tabSwitches}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Tab Switch Detected!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                You navigated away from the practice test at <strong className="text-slate-900 dark:text-white">{lastViolationTime}</strong>. All tab changes are recorded for recruiter review and performance tracking.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold">
                <span>Practice Integrity Policy</span>
                <span className={tabSwitches >= 3 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                  {tabSwitches >= 3 ? '🚨 Flagged Status (3+ Violations)' : `Warning ${tabSwitches} of 3`}
                </span>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Remain focused on the examination and study questions.</li>
                <li>Do not leave or switch browser tabs during tests.</li>
                <li>Stay on the current window for accurate speed metrics.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setShowTabWarningModal(false);
                document.title = 'CampusEdge - Practice Mode';
              }}
              className="w-full py-3.5 rounded-xl font-black text-xs bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              I Understand & Resume Practice ➔
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN RE-ENTRY REQUIRED BARRIER MODAL */}
      <FullscreenBarrierModal
        isOpen={showFullscreenBarrier}
        onReEnterFullscreen={handleReEnterFullscreen}
        title={`${selectedCategory || 'Subject'} Practice Mode`}
      />

      {/* TWO-STEP EXIT VERIFICATION MODAL */}
      <TwoStepExitModal
        isOpen={showTwoStepExitModal}
        onClose={() => setShowTwoStepExitModal(false)}
        onConfirmExit={handleConfirmForfeitPractice}
        testTitle={`${selectedCategory || 'Subject'} Practice Session`}
        tabSwitches={tabSwitches}
      />

      {/* DISQUALIFICATION MODAL ON 3-STRIKES */}
      <DisqualificationModal
        isOpen={showDisqualificationModal}
        onAcknowledge={() => {
          setShowDisqualificationModal(false);
          setSelectedCategory(null);
          setViewMode('select');
        }}
        testTitle={`${selectedCategory || 'Subject'} Practice Session`}
        tabSwitches={tabSwitches}
        violationLogs={tabSwitchLogs}
      />

    </div>
  );
}