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

export default function MockTest({ questions = [], onEndTest }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [filterReview, setFilterReview] = useState('all'); // 'all', 'correct', 'incorrect'
  const { showSuccess, showError, showWarning } = useToast();
  
  // Timer State (1 minute per question)
  const initialTime = Math.max(60, questions.length * 60);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  
  // Fullscreen Proctored Mode State
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [showFullscreenBarrier, setShowFullscreenBarrier] = useState(false);

  // Two-Step Exit & Disqualification Modal State
  const [showTwoStepExitModal, setShowTwoStepExitModal] = useState(false);
  const [showDisqualificationModal, setShowDisqualificationModal] = useState(false);

  // Completion & Review State
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [finalScore, setFinalScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Anti-Cheat & Tab Switch Proctoring State
  const [tabSwitches, setTabSwitches] = useState(0);
  const [tabSwitchLogs, setTabSwitchLogs] = useState([]);
  const [showTabWarningModal, setShowTabWarningModal] = useState(false);
  const [lastViolationTime, setLastViolationTime] = useState(null);
  const lastViolationRef = React.useRef(0);
  const wasAwayRef = React.useRef(false);
  const tabSwitchesRef = React.useRef(0);

  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : {};
  const userEmail = user?.email || 'default@student.com';

  const currentQuestion = questions[currentIndex] || {};
  const category = currentQuestion?.category || currentQuestion?.tag || 'General';

  // Request system notification permissions on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Prevent leaving or reloading tab during active test
  useEffect(() => {
    if (isCompleted || submitting) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Assessment is currently in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCompleted, submitting]);

  const handleAutoDisqualify = async (switchesCount, currentLogs) => {
    setSubmitting(true);
    playProctorAlertChime();
    exitFullscreenMode().catch(() => {});
    setShowTabWarningModal(false);
    setShowDisqualificationModal(true);

    let calculatedScore = 0;
    const evaluatedAnswers = questions.map((q, idx) => {
      const selected = userAnswers[idx] || null;
      const correct = q.correctAnswer || q.answer;
      const isCorrect = selected === correct;
      if (isCorrect) calculatedScore += 1;

      return {
        question: q.question || q.text,
        selected: selected,
        correct: correct,
        isCorrect: isCorrect,
        explanation: q.explanation,
        difficulty: q.difficulty || 'Medium'
      };
    });

    setFinalScore(calculatedScore);
    setSessionAnswers(evaluatedAnswers);

    const payload = {
      email: userEmail,
      category: `${category} (DISQUALIFIED - 3 Tab Violations)`, 
      score: calculatedScore,
      total: questions.length,
      percentage: Math.round((calculatedScore / questions.length) * 100),
      test_date: new Date().toLocaleDateString(),
      tab_switches: switchesCount,
      fullData: { 
        coveredQuestions: evaluatedAnswers,
        tabSwitches: switchesCount,
        tabSwitchLogs: currentLogs,
        isDisqualified: true,
        disqualificationReason: "Candidate exceeded 3 proctoring tab violations"
      }
    };

    if (userEmail && userEmail !== 'default@student.com') {
      try {
        await apiFetch('/api/questions/save-history', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Failed to save disqualified test record:", err);
      }
    }

    setSubmitting(false);
    setIsCompleted(true);
  };

  // Tab Switch & Visibility Change Detection Listener
  const resetAwayTimeoutRef = React.useRef(null);

  useEffect(() => {
    if (isCompleted || submitting) return;

    const originalTitle = document.title;

    const triggerViolation = (type) => {
      const now = Date.now();
      // Block duplicate triggers for the same departure or within 2.5s cooldown
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
            "🚨 Assessment Terminated - 3 Violations!", 
            `You exceeded 3 tab switches. Your test has been terminated and auto-submitted.`
          );
          document.title = `🚨 [DISQUALIFIED] Test Terminated!`;
          handleAutoDisqualify(nextCount, updatedLogs);
        }
        return updatedLogs;
      });
      setLastViolationTime(timeString);
      playProctorAlertChime();

      if (nextCount < 3) {
        setShowTabWarningModal(true);
        sendSystemProctorNotification(
          "⚠️ Proctoring Violation Detected!", 
          `Tab switch detected at ${timeString}. Warning ${nextCount} of 3! Return immediately.`
        );
        showWarning(`⚠️ Proctoring Warning: Tab switch / window blur detected! (Warning ${nextCount} of 3)`);
        document.title = `⚠️ [PROCTOR WARNING ${nextCount}/3] Return to Test!`;
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
  }, [isCompleted, submitting]);

  // Auto-request Fullscreen on Mount and Lock Monitor
  useEffect(() => {
    enterFullscreenMode().then((success) => {
      if (success) {
        setIsFullscreen(true);
      }
    });

    const handleFSChange = () => {
      const inFS = Boolean(document.fullscreenElement);
      setIsFullscreen(inFS);
      if (!inFS && !isCompleted && !submitting) {
        setShowFullscreenBarrier(true);
      } else {
        setShowFullscreenBarrier(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
    };
  }, [isCompleted, submitting]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await enterFullscreenMode();
    } else {
      await exitFullscreenMode();
    }
  };

  const handleReEnterFullscreen = async () => {
    await enterFullscreenMode();
    setShowFullscreenBarrier(false);
  };

  const handleOpenExitModal = () => {
    setShowTwoStepExitModal(true);
  };

  const handleConfirmForfeitAndExit = () => {
    setShowTwoStepExitModal(false);
    exitFullscreenMode().catch(() => {});
    if (onEndTest) {
      onEndTest();
    } else {
      handleSubmitTest();
    }
  };

  // Countdown Timer Effect
  useEffect(() => {
    if (isCompleted || submitting) return;

    if (timeLeft <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isCompleted, submitting]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOptionClick = (opt) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentIndex]: opt
    }));
  };

  const toggleFlag = (idx) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    setSubmitting(true);

    let calculatedScore = 0;
    const evaluatedAnswers = questions.map((q, idx) => {
      const selected = userAnswers[idx] || null;
      const correct = q.correctAnswer || q.answer;
      const isCorrect = selected === correct;
      if (isCorrect) calculatedScore += 1;

      return {
        question: q.question || q.text,
        selected: selected,
        correct: correct,
        isCorrect: isCorrect,
        explanation: q.explanation,
        difficulty: q.difficulty || 'Medium'
      };
    });

    setFinalScore(calculatedScore);
    setSessionAnswers(evaluatedAnswers);

    const totalQuestions = questions.length;
    const percentage = Math.round((calculatedScore / totalQuestions) * 100);
    const currentDate = new Date().toLocaleDateString();

    const payload = {
      email: userEmail,
      category: category, 
      score: calculatedScore,
      total: totalQuestions,
      percentage: percentage,
      test_date: currentDate,
      tab_switches: tabSwitches,
      fullData: { 
        coveredQuestions: evaluatedAnswers,
        tabSwitches: tabSwitches,
        tabSwitchLogs: tabSwitchLogs
      }
    };

    if (userEmail && userEmail !== 'default@student.com') {
      try {
        await apiFetch('/api/questions/save-history', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showSuccess(`Mock Test completed! Score: ${calculatedScore}/${totalQuestions} (${percentage}%)`);
      } catch (err) {
        console.error("Failed to save mock test history:", err);
      }
    }

    // Persist seen IDs only for submitted test
    try {
      const answeredQuestionIds = questions.map(q => q.id).filter(Boolean);
      if (answeredQuestionIds.length > 0) {
        const key = `campusedge_seen_mock_${encodeURIComponent(category)}_all`;
        const saved = localStorage.getItem(key);
        const current = saved ? JSON.parse(saved) : [];
        const combined = [...new Set([...current, ...answeredQuestionIds])];
        localStorage.setItem(key, JSON.stringify(combined));
      }
    } catch (e) {
      console.warn("Error updating seen question IDs:", e);
    }

    setSubmitting(false);
    streakManager.recordActivity({
      type: 'mock',
      xp: Math.max(100, Math.round(calculatedScore * 20)),
      coins: 30,
      title: `Completed Mock Test: ${category} (${calculatedScore}/${totalQuestions})`
    });
    exitFullscreenMode();
    setIsFullscreenBarrierOpen(false);
    setIsCompleted(true);
  };

  const handleExitTest = () => {
    const confirmExit = window.confirm(
      "Are you sure you want to exit the assessment midway? Your unattempted questions will remain saved for future test rounds."
    );
    if (confirmExit) {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if (onEndTest) {
        onEndTest();
      }
    }
  };

  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl p-16 rounded-3xl shadow-2xl border border-slate-800 text-center text-white animate-fade-in">
        <div className="w-14 h-14 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-xl font-black">Evaluating Assessment...</h3>
        <p className="text-xs text-slate-400 mt-1">Grading responses and recording score to university leaderboard...</p>
      </div>
    );
  }

  // ==========================================
  // COMPLETION REPORT CARD VIEW
  // ==========================================
  if (isCompleted) {
    const percentage = Math.round((finalScore / questions.length) * 100);
    const answeredCount = Object.keys(userAnswers).length;
    const skippedCount = questions.length - answeredCount;
    const incorrectCount = questions.length - finalScore;

    const filteredBreakdown = sessionAnswers.filter(item => {
      if (filterReview === 'correct') return item.isCorrect;
      if (filterReview === 'incorrect') return !item.isCorrect;
      return true;
    });

    let performanceBadge = "Needs Revision";
    let badgeColor = "from-rose-500 to-amber-500 text-rose-300 border-rose-500/40 bg-rose-950/60";
    if (percentage >= 85) {
      performanceBadge = "🌟 Top 5% Placement Ready";
      badgeColor = "from-emerald-500 to-teal-500 text-emerald-300 border-emerald-500/40 bg-emerald-950/60";
    } else if (percentage >= 70) {
      performanceBadge = "⚡ Strong Placement Match";
      badgeColor = "from-indigo-500 to-purple-500 text-indigo-300 border-indigo-500/40 bg-indigo-950/60";
    }

    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-8 animate-fade-in text-slate-900 dark:text-white font-sans">
        
        {/* Top Header */}
        <div className="text-center space-y-4 pb-8 border-b border-slate-200 dark:border-slate-800">
          <span className={`inline-block text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full border ${badgeColor}`}>
            {performanceBadge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {category} Assessment Scorecard
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your results have been logged to your candidate profile and the university leaderboard.
          </p>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto pt-2">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Score</p>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{finalScore}/{questions.length}</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Accuracy</p>
              <p className={`text-2xl sm:text-3xl font-black mt-0.5 ${percentage >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {percentage}%
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Incorrect</p>
              <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{incorrectCount}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Skipped</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-600 dark:text-slate-400 mt-0.5">{skippedCount}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tab Switches</p>
              <p className={`text-xl sm:text-2xl font-black mt-0.5 ${tabSwitches === 0 ? 'text-emerald-600 dark:text-emerald-400' : tabSwitches <= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {tabSwitches} {tabSwitches === 0 ? '🛡️' : '⚠️'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Concept Review Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Comprehensive Question Breakdown</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Review answers, explanations, and concepts for this test.</p>
            </div>

            {/* Filter Pills */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                onClick={() => setFilterReview('all')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterReview === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                All ({sessionAnswers.length})
              </button>
              <button
                onClick={() => setFilterReview('correct')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterReview === 'correct' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Correct ({finalScore})
              </button>
              <button
                onClick={() => setFilterReview('incorrect')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterReview === 'incorrect' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Incorrect ({incorrectCount})
              </button>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
            {filteredBreakdown.map((q, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-2xl border ${
                  q.isCorrect 
                    ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/15' 
                    : 'border-rose-300 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/15'
                } space-y-2.5 text-xs animate-fade-in`}
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                    Question #{idx + 1} &bull; {q.difficulty}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                    q.isCorrect 
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' 
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                  }`}>
                    {q.isCorrect ? '✓ Correct (+1)' : '✗ Incorrect (0)'}
                  </span>
                </div>

                <p className="font-bold text-slate-900 dark:text-white text-sm leading-relaxed">{q.question}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Your Selection:</span>
                    <span className={q.isCorrect ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-rose-700 dark:text-rose-400 font-bold'}>
                      {q.selected || '⚠️ Unanswered / Skipped'}
                    </span>
                  </div>

                  {!q.isCorrect && (
                    <div className="p-3 bg-white dark:bg-slate-950/80 rounded-xl border border-emerald-300 dark:border-emerald-500/20">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">Correct Answer:</span>
                      <span className="text-emerald-800 dark:text-emerald-300 font-bold">{q.correct}</span>
                    </div>
                  )}
                </div>

                {q.explanation && (
                  <div className="p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                    <strong className="text-indigo-600 dark:text-indigo-400">💡 Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onEndTest}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-black transition shadow-lg shadow-indigo-600/30 cursor-pointer text-xs sm:text-sm transform hover:-translate-y-0.5"
          >
            Return to Dashboard Overview ➔
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE TEST ARENA VIEW
  // ==========================================
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans animate-fade-in">
      
      {/* Top HUD: Subject, Timer, and Question Counter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full">
              ⚡ Mock Assessment • {category}
            </span>
            {flaggedQuestions[currentIndex] && (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                🚩 Flagged for Review
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            Question {currentIndex + 1} of {questions.length}
          </h2>
        </div>

        {/* HUD Controls: Timer, Fullscreen, Proctoring Badge, and Flag */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Proctoring Status Pill */}
          <div 
            className={`px-3 py-2 rounded-2xl border text-xs font-black flex items-center gap-1.5 shadow-xs transition-all ${
              tabSwitches === 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                : tabSwitches <= 2 
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/50 animate-pulse ring-1 ring-amber-400/40' 
                : 'bg-rose-50 dark:bg-rose-950/90 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/60 animate-pulse ring-2 ring-rose-500/50'
            }`}
            title="Proctoring System: Tracks tab switches and window unfocus events"
          >
            <span>{tabSwitches === 0 ? '🛡️' : '⚠️'}</span>
            <span className="hidden sm:inline">{tabSwitches === 0 ? 'Proctor Clean' : `${tabSwitches} ${tabSwitches === 1 ? 'Tab Switch' : 'Tab Switches'}`}</span>
            <span className="sm:hidden">{tabSwitches === 0 ? 'Clean' : `${tabSwitches} Warn`}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className={`px-3 py-2 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isFullscreen
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/40'
                : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/40 animate-pulse'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Examination Mode'}
          >
            <span>{isFullscreen ? '🖥️' : '⛶'}</span>
            <span className="hidden sm:inline">{isFullscreen ? 'Fullscreen Active' : 'Enter Fullscreen'}</span>
          </button>

          <div className={`px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2 border shadow-md transition-all ${
            timeLeft < 60 
              ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/60 animate-pulse ring-2 ring-rose-500/30' 
              : timeLeft < 180 
              ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/40' 
              : 'bg-slate-50 dark:bg-slate-950 text-indigo-700 dark:text-indigo-300 border-slate-200 dark:border-indigo-500/30'
          }`}>
            <span className="text-base">⏱️</span>
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => toggleFlag(currentIndex)}
            className={`p-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
              flaggedQuestions[currentIndex]
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Flag question for review before submitting"
          >
            🚩
          </button>

          {onEndTest && (
            <button
              onClick={handleOpenExitModal}
              className="px-3 py-2 rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
              title="Exit Assessment"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Palette Jump Bar */}
      <div className="mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2.5">
          <span>Question Palette</span>
          <span>Answered: <strong className="text-emerald-600 dark:text-emerald-400">{answeredCount}/{questions.length}</strong></span>
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.map((_, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = userAnswers[idx] !== undefined;
            const isFlagged = flaggedQuestions[idx];

            let badgeStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700";
            if (isCurrent) {
              badgeStyle = "bg-indigo-600 border-indigo-400 text-white font-black ring-2 ring-indigo-500/40 shadow-md";
            } else if (isFlagged) {
              badgeStyle = "bg-amber-100 dark:bg-amber-950 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-300 font-bold";
            } else if (isAnswered) {
              badgeStyle = "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold";
            }

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-xl border text-xs transition cursor-pointer flex items-center justify-center ${badgeStyle}`}
                title={`Jump to Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* QUESTION BODY */}
      {currentQuestion && (
        <div className="mb-8">
          <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2.5 py-0.5 rounded-md mb-3 uppercase tracking-wider">
            Difficulty: {currentQuestion.difficulty || 'Medium'}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">
            {currentQuestion.question || currentQuestion.text}
          </h3>

          <div className="space-y-3">
            {(currentQuestion.options || []).map((opt, idx) => {
              const isSelected = userAnswers[currentIndex] === opt;
              
              let optionStyle = "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500/60 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/60";
              if (isSelected) {
                optionStyle = "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-white font-bold ring-2 ring-indigo-500/30 shadow-md";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all text-xs sm:text-sm font-semibold flex items-center justify-between cursor-pointer group ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                      isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isSelected && (
                    <span className="text-indigo-700 dark:text-indigo-300 text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/80 px-2.5 py-1 rounded-lg border border-indigo-300 dark:border-indigo-500/40">
                      Selected ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`px-5 py-3 rounded-xl font-bold text-xs transition ${
            currentIndex === 0 
              ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500' 
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer shadow-sm border border-slate-200 dark:border-transparent'
          }`}
        >
          ← Previous
        </button>

        <div className="flex gap-3">
          {currentIndex + 1 === questions.length ? (
            <button
              onClick={handleSubmitTest}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3.5 rounded-xl font-black transition shadow-lg shadow-emerald-600/30 cursor-pointer text-xs sm:text-sm transform hover:-translate-y-0.5"
            >
              Submit Assessment & Grade ➔
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-black transition shadow-lg shadow-indigo-600/30 cursor-pointer text-xs sm:text-sm transform hover:-translate-y-0.5"
            >
              Next Question →
            </button>
          )}
        </div>
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
                You navigated away from the exam tab at <strong className="text-slate-900 dark:text-white">{lastViolationTime}</strong>. All tab changes and window unfocus events are recorded and reported to recruiters & administrators.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold">
                <span>Examination Policy</span>
                <span className={tabSwitches >= 3 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                  {tabSwitches >= 3 ? '🚨 Flagged Status (3+ Violations)' : `Warning ${tabSwitches} of 3`}
                </span>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Remain on this tab for the entire duration of the test.</li>
                <li>Do not switch apps, minimize windows, or open inspect tools.</li>
                <li>Repeated violations will lower your candidate integrity score.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setShowTabWarningModal(false);
                document.title = 'CampusEdge - Assessment In Progress';
              }}
              className="w-full py-3.5 rounded-xl font-black text-xs bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              I Understand & Resume Examination ➔
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN RE-ENTRY REQUIRED BARRIER MODAL */}
      <FullscreenBarrierModal
        isOpen={showFullscreenBarrier}
        onReEnterFullscreen={handleReEnterFullscreen}
        title={`${category} Mock Assessment`}
      />

      {/* TWO-STEP EXIT VERIFICATION MODAL */}
      <TwoStepExitModal
        isOpen={showTwoStepExitModal}
        onClose={() => setShowTwoStepExitModal(false)}
        onConfirmExit={handleConfirmForfeitAndExit}
        testTitle={`${category} Mock Assessment`}
        tabSwitches={tabSwitches}
      />

      {/* DISQUALIFICATION MODAL ON 3-STRIKES */}
      <DisqualificationModal
        isOpen={showDisqualificationModal}
        onAcknowledge={() => {
          setShowDisqualificationModal(false);
          if (onEndTest) onEndTest();
        }}
        testTitle={`${category} Mock Assessment`}
        tabSwitches={tabSwitches}
        violationLogs={tabSwitchLogs}
      />

    </div>
  );
}