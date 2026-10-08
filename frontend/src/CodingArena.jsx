import { streakManager } from './streakManager';
import React, { useState, useEffect, useRef } from 'react';
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

export default function CodingArena({ userEmail, userName, onBack }) {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(true);
  
  // Arena State
  const [arenaMode, setArenaMode] = useState('practice'); // 'practice' | 'timed_test'
  const [difficultyFilter, setDifficultyFilter] = useState('All'); // 'All' | 'Easy' | 'Medium' | 'Hard'
  const [activeLeftTab, setActiveLeftTab] = useState('description'); // 'description' | 'logic' | 'hints'
  const [language, setLanguage] = useState('javascript'); // 'javascript' | 'python' | 'java' | 'cpp'
  const [code, setCode] = useState('');
  
  // "Logic First" Formulation State
  const [logicDraft, setLogicDraft] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('O(N)');
  const [spaceComplexity, setSpaceComplexity] = useState('O(N)');
  const [edgeCasesInput, setEdgeCasesInput] = useState('');
  const [isEvaluatingLogic, setIsEvaluatingLogic] = useState(false);
  const [logicEvaluation, setLogicEvaluation] = useState(null);

  // Progressive Hints State
  const [unlockedHintLevel, setUnlockedHintLevel] = useState(0);
  const [hintsList, setHintsList] = useState([]);
  const [loadingHint, setLoadingHint] = useState(false);

  // Test Runner Execution State
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);
  const [executionResult, setExecutionResult] = useState(null);

  // Timed Assessment Clock
  const [testTimeRemaining, setTestTimeRemaining] = useState(45 * 60); // 45 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Proctoring & Anti-Cheat State for Coding Test
  const [tabSwitches, setTabSwitches] = useState(0);
  const [tabSwitchLogs, setTabSwitchLogs] = useState([]);
  const [showTabWarningModal, setShowTabWarningModal] = useState(false);
  const [showDisqualificationModal, setShowDisqualificationModal] = useState(false);
  const [lastViolationTime, setLastViolationTime] = useState(null);
  const lastViolationRef = useRef(0);
  const wasAwayRef = useRef(false);
  const tabSwitchesRef = useRef(0);

  // Fullscreen & Two-Step Exit State
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [showFullscreenBarrier, setShowFullscreenBarrier] = useState(false);
  const [showTwoStepExitModal, setShowTwoStepExitModal] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState(null); // 'back' | 'switch_to_practice'

  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // Prevent leaving or reloading during active timed test
  useEffect(() => {
    if (arenaMode !== 'timed_test' || !isTimerRunning) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Coding assessment is currently in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [arenaMode, isTimerRunning]);

  const handleAutoDisqualifyCoding = async (switchesCount, currentLogs) => {
    setIsTimerRunning(false);
    playProctorAlertChime();
    exitFullscreenMode().catch(() => {});
    setShowTabWarningModal(false);
    setShowDisqualificationModal(true);

    try {
      await apiFetch('/api/code/run', {
        method: 'POST',
        body: JSON.stringify({
          problemId: selectedProblem?.id,
          language,
          code: code || '// Empty submission - Disqualified due to 3 proctoring tab switches',
          isSubmit: true,
          email: userEmail,
          studentName: userName,
          arenaMode: 'timed_test (DISQUALIFIED - 3 Tab Violations)',
          tabSwitches: switchesCount,
          tabSwitchLogs: currentLogs
        })
      });
    } catch (err) {
      console.error("Failed to save disqualified coding record:", err);
    }
  };

  // Tab Switch & Visibility Change Detection in Timed Test
  const resetAwayTimeoutRef = React.useRef(null);

  useEffect(() => {
    if (arenaMode !== 'timed_test' || !isTimerRunning) return;

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
        message: `Candidate left coding assessment window (${type})`
      };

      setTabSwitches(nextCount);
      setTabSwitchLogs(prevLogs => {
        const updatedLogs = [...prevLogs, logEntry];
        if (nextCount >= 3) {
          sendSystemProctorNotification(
            "🚨 Coding Assessment Terminated - 3 Violations!", 
            `You exceeded 3 tab switches. Your test has been terminated and auto-submitted.`
          );
          document.title = `🚨 [DISQUALIFIED] Coding Exam Terminated!`;
          handleAutoDisqualifyCoding(nextCount, updatedLogs);
        }
        return updatedLogs;
      });
      setLastViolationTime(timeString);
      playProctorAlertChime();

      if (nextCount < 3) {
        setShowTabWarningModal(true);
        sendSystemProctorNotification(
          "⚠️ Proctoring Warning!", 
          `Tab switch detected during coding exam at ${timeString}. Warning ${nextCount} of 3! Return immediately.`
        );
        showWarning(`⚠️ Proctoring Warning: Tab switch / window blur detected! (Warning ${nextCount} of 3)`);
        document.title = `⚠️ [PROCTOR WARNING ${nextCount}/3] Return to Coding Test!`;
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
  }, [arenaMode, isTimerRunning]);

  // Fullscreen monitor in timed test mode
  useEffect(() => {
    if (arenaMode !== 'timed_test' || !isTimerRunning) {
      setShowFullscreenBarrier(false);
      return;
    }

    const handleFSChange = () => {
      const inFS = Boolean(document.fullscreenElement);
      setIsFullscreen(inFS);
      if (!inFS && arenaMode === 'timed_test' && isTimerRunning) {
        setShowFullscreenBarrier(true);
      } else {
        setShowFullscreenBarrier(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
    };
  }, [arenaMode, isTimerRunning]);

  const handleReEnterFullscreen = async () => {
    await enterFullscreenMode();
    setShowFullscreenBarrier(false);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    let interval = null;
    if (arenaMode === 'timed_test' && isTimerRunning && testTimeRemaining > 0) {
      interval = setInterval(() => {
        setTestTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            showWarning("⏱️ Time is up! Assessment test submitted automatically.");
            handleRunCode(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [arenaMode, isTimerRunning, testTimeRemaining]);

  const fetchProblems = async () => {
    setLoadingProblems(true);
    try {
      const res = await apiFetch('/api/code/problems');
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
        if (data.length > 0) {
          selectProblem(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load problems:", err);
      showError("Failed to connect to coding challenges database.");
    }
    setLoadingProblems(false);
  };

  const selectProblem = async (prob) => {
    setSelectedProblem(prob);
    setCode(prob.starterCode?.[language] || prob.starterCode?.javascript || "");
    setLogicDraft('');
    setLogicEvaluation(null);
    setEdgeCasesInput('');
    setUnlockedHintLevel(0);
    setHintsList([]);
    setExecutionResult(null);
    setActiveTestCaseTab(0);
    setActiveLeftTab('description');

    // Fetch full problem details with hidden test cases and hints count
    try {
      const detailRes = await apiFetch(`/api/code/problems/${prob.id}`);
      if (detailRes.ok) {
        const detailed = await detailRes.json();
        setSelectedProblem(detailed);
      }
    } catch (e) {
      console.warn("Problem detail fetch fallback:", e.message);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (selectedProblem?.starterCode?.[newLang]) {
      setCode(selectedProblem.starterCode[newLang]);
    }
  };

  const handleResetCode = () => {
    if (window.confirm("Reset editor to initial starter template?")) {
      setCode(selectedProblem?.starterCode?.[language] || "");
      showInfo("Code reset to default boilerplate.");
    }
  };

  // Evaluate "Logic First" Blueprint with AI
  const handleEvaluateLogic = async () => {
    if (!logicDraft.trim() || logicDraft.trim().length < 10) {
      showWarning("Please write at least a sentence explaining your approach before evaluating.");
      return;
    }

    setIsEvaluatingLogic(true);
    try {
      const res = await apiFetch('/api/code/evaluate-logic', {
        method: 'POST',
        body: JSON.stringify({
          problemId: selectedProblem?.id,
          logicDraft: logicDraft.trim(),
          timeComplexity,
          spaceComplexity,
          edgeCases: edgeCasesInput.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLogicEvaluation(data);
        showSuccess(`Logic Evaluated: ${data.verdict} (${data.logicScore}/100)`);
      } else {
        showError("Failed to evaluate logic. Please try again.");
      }
    } catch (err) {
      console.error("Logic evaluation error:", err);
      showError("Server error evaluating logic formulation.");
    }
    setIsEvaluatingLogic(false);
  };

  // Unlock Progressive Hint
  const handleUnlockNextHint = async () => {
    const nextLevel = unlockedHintLevel + 1;
    setLoadingHint(true);
    try {
      const res = await apiFetch('/api/code/hint', {
        method: 'POST',
        body: JSON.stringify({
          problemId: selectedProblem?.id,
          hintLevel: nextLevel
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHintsList(prev => [...prev, data]);
        setUnlockedHintLevel(nextLevel);
        showInfo(`Unlocked ${data.hintTitle}`);
      } else {
        showWarning("No further hints available for this problem.");
      }
    } catch (err) {
      console.error("Hint unlock error:", err);
      showError("Error unlocking progressive hint.");
    }
    setLoadingHint(false);
  };

  // Run Code against Test Cases
  const handleRunCode = async (isSubmit = false) => {
    if (!code.trim()) {
      showWarning("Please write your solution code before running.");
      return;
    }

    setIsRunningCode(true);
    try {
      const res = await apiFetch('/api/code/run', {
        method: 'POST',
        body: JSON.stringify({
          problemId: selectedProblem?.id,
          language,
          code,
          isSubmit,
          email: userEmail,
          studentName: userName,
          arenaMode,
          tabSwitches,
          tabSwitchLogs
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExecutionResult(data);

        if (isSubmit && arenaMode === 'timed_test') {
          setIsTimerRunning(false);
          setArenaMode('practice');
          exitFullscreenMode();
          setIsFullscreen(false);
          setIsFullscreenBarrierOpen(false);
          showInfo("Timed test completed and submitted. Fullscreen exited.");
        }

        if (data.status === "Accepted") {
          streakManager.recordActivity({
            type: 'code',
            xp: 150,
            coins: 30,
            title: `Accepted: ${selectedProblem?.title || 'Coding Problem'} (${language})`
          });
          showSuccess(`🎉 Accepted! Passed ${data.passedCount}/${data.totalTestCases} test cases (${data.runtimeMs}ms).`);
        } else if (data.status === "Runtime Error") {
          showError(`Runtime Error: ${data.error}`);
        } else {
          showWarning(`Wrong Answer: Passed ${data.passedCount}/${data.totalTestCases} test cases.`);
        }
      } else {
        showError("Failed to execute code on runner sandbox.");
      }
    } catch (err) {
      console.error("Run error:", err);
      showError("Execution connection error.");
    }
    setIsRunningCode(false);
  };

  const handleStartTimedTest = () => {
    setArenaMode('timed_test');
    setIsTimerRunning(true);
    requestNotificationPermission();
    enterFullscreenMode().then((success) => {
      if (success) setIsFullscreen(true);
    });
  };

  const handleRequestSwitchToPractice = () => {
    if (arenaMode === 'timed_test' && isTimerRunning) {
      setPendingExitAction('switch_to_practice');
      setShowTwoStepExitModal(true);
    } else {
      setArenaMode('practice');
      setIsTimerRunning(false);
    }
  };

  const handleRequestBack = () => {
    if (arenaMode === 'timed_test' && isTimerRunning) {
      setPendingExitAction('back');
      setShowTwoStepExitModal(true);
    } else if (onBack) {
      onBack();
    }
  };

  const handleConfirmForfeitCodingTest = () => {
    setShowTwoStepExitModal(false);
    exitFullscreenMode().catch(() => {});
    setIsTimerRunning(false);

    // Save forfeited submission
    handleRunCode(true);

    if (pendingExitAction === 'back' && onBack) {
      onBack();
    } else {
      setArenaMode('practice');
    }
    setPendingExitAction(null);
  };

  const filteredProblems = problems.filter(p => {
    if (difficultyFilter === 'All') return true;
    return p.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
  });

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-900 dark:text-white font-sans">
      
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-2xl shadow-inner">
            💻
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Algorithm & Coding Arena</h2>
              <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/30">
                Live Compiler v2.5
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Draft your logic first, unlock progressive hints, and test code against hidden test cases.
            </p>
          </div>
        </div>

        {/* Mode Selector & Timer & Proctoring Status */}
        <div className="flex flex-wrap items-center gap-3">
          {arenaMode === 'timed_test' && (
            <div 
              className={`px-3 py-1.5 rounded-2xl border text-xs font-black flex items-center gap-1.5 shadow-xs transition-all ${
                tabSwitches === 0 
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                  : tabSwitches <= 2 
                  ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/50 animate-pulse ring-1 ring-amber-400/40' 
                  : 'bg-rose-50 dark:bg-rose-950/90 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/60 animate-pulse ring-2 ring-rose-500/50'
              }`}
              title="Coding Assessment Proctoring Integrity Status"
            >
              <span>{tabSwitches === 0 ? '🛡️' : '⚠️'}</span>
              <span>{tabSwitches === 0 ? 'Clean' : `${tabSwitches} ${tabSwitches === 1 ? 'Tab Switch' : 'Tab Switches'}`}</span>
            </div>
          )}

          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1 text-xs font-bold">
            <button
              onClick={handleRequestSwitchToPractice}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                arenaMode === 'practice'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>⚡</span> Self-Paced Practice
            </button>
            <button
              onClick={handleStartTimedTest}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                arenaMode === 'timed_test'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>⏱️</span> Timed Test Exam
            </button>
          </div>

          {arenaMode === 'timed_test' && (
            <div className="bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/40 px-3.5 py-2 rounded-2xl flex items-center gap-2 font-mono font-bold text-xs text-purple-700 dark:text-purple-200">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
              <span>{formatTimer(testTimeRemaining)}</span>
            </div>
          )}

          {onBack && (
            <button
              onClick={handleRequestBack}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-transparent"
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* Problem Selection Strip */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        
        {/* Difficulty Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1 uppercase tracking-wider">Difficulty:</span>
          {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                difficultyFilter === diff
                  ? diff === 'Easy'
                    ? 'bg-emerald-100 dark:bg-emerald-600/30 border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : diff === 'Medium'
                    ? 'bg-amber-100 dark:bg-amber-600/30 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-300'
                    : diff === 'Hard'
                    ? 'bg-rose-100 dark:bg-rose-600/30 border-rose-400 dark:border-rose-500 text-rose-800 dark:text-rose-300'
                    : 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Problem Selector Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">Challenge:</span>
          <select
            value={selectedProblem?.id || ''}
            onChange={(e) => {
              const found = problems.find(p => p.id === e.target.value);
              if (found) selectProblem(found);
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer w-full sm:w-72 shadow-sm"
          >
            {filteredProblems.map(p => (
              <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {p.difficulty === 'Easy' ? '🟢' : p.difficulty === 'Medium' ? '🟡' : '🔴'} {p.title} ({p.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: PROBLEM / LOGIC / HINTS ================= */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-auto min-h-[420px] lg:h-[750px]">
          
          {/* Left Column Tabs */}
          <div className="bg-slate-100 dark:bg-slate-950 p-2 border-b border-slate-200 dark:border-slate-800 flex gap-2">
            <button
              onClick={() => setActiveLeftTab('description')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeLeftTab === 'description'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📄</span> Description
            </button>

            <button
              onClick={() => setActiveLeftTab('logic')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeLeftTab === 'logic'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-white'
              }`}
            >
              <span>🧠</span> Logic Blueprint
            </button>

            {arenaMode === 'practice' && (
              <button
                onClick={() => setActiveLeftTab('hints')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeLeftTab === 'hints'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-white'
                }`}
              >
                <span>💡</span> Hints ({unlockedHintLevel}/4)
              </button>
            )}
          </div>

          {/* Left Column Scrollable Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white dark:bg-slate-900">
            
            {/* TAB 1: DESCRIPTION */}
            {activeLeftTab === 'description' && selectedProblem && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                      selectedProblem.difficulty === 'Easy'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                        : selectedProblem.difficulty === 'Medium'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                    }`}>
                      {selectedProblem.difficulty}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {selectedProblem.category}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">
                      Acceptance: {selectedProblem.acceptance}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedProblem.title}</h3>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                  {selectedProblem.description}
                </div>

                {/* Examples */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Examples:</h4>
                  {selectedProblem.examples?.map((ex, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs font-mono">
                      <p><strong className="text-indigo-600 dark:text-indigo-400 font-sans">Input:</strong> {ex.input}</p>
                      <p><strong className="text-emerald-600 dark:text-emerald-400 font-sans">Output:</strong> {ex.output}</p>
                      {ex.explanation && (
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans pt-1 border-t border-slate-200 dark:border-slate-800/60">
                          <strong className="text-slate-800 dark:text-slate-300">Explanation:</strong> {ex.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {selectedProblem.constraints && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Constraints:</h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
                      {selectedProblem.constraints.map((c, i) => (
                        <li key={i}><code className="text-indigo-600 dark:text-indigo-300 font-mono">{c}</code></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: "LOGIC FIRST" BLUEPRINT BUILDER */}
            {activeLeftTab === 'logic' && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    🧠 Step 1: Formulate Your Logic First
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    Top tech recruiters recommend outlining your thought process before touching code. Write your approach and estimated complexity below:
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      1. Algorithmic Approach / Pseudocode Thought:
                    </label>
                    <textarea
                      rows={4}
                      placeholder="e.g. I will use a HashMap to store complements (target - current). In one pass, if complement exists in map, return indices. Otherwise store element..."
                      value={logicDraft}
                      onChange={(e) => setLogicDraft(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Target Time Complexity:</label>
                      <select
                        value={timeComplexity}
                        onChange={(e) => setTimeComplexity(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-bold outline-none shadow-sm"
                      >
                        <option value="O(1)">O(1) Constant</option>
                        <option value="O(log N)">O(log N) Logarithmic</option>
                        <option value="O(N)">O(N) Linear</option>
                        <option value="O(N log N)">O(N log N) Linearithmic</option>
                        <option value="O(N^2)">O(N^2) Quadratic</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Target Space Complexity:</label>
                      <select
                        value={spaceComplexity}
                        onChange={(e) => setSpaceComplexity(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-bold outline-none shadow-sm"
                      >
                        <option value="O(1)">O(1) Auxiliary</option>
                        <option value="O(N)">O(N) Extra Memory</option>
                        <option value="O(N^2)">O(N^2) Matrix</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      2. Potential Edge Cases to Watch:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Empty array, negative values, duplicates, large inputs..."
                      value={edgeCasesInput}
                      onChange={(e) => setEdgeCasesInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>

                  <button
                    onClick={handleEvaluateLogic}
                    disabled={isEvaluatingLogic || !logicDraft.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs py-3 rounded-2xl shadow-lg transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {isEvaluatingLogic ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Evaluating Logic Blueprint...</span>
                      </>
                    ) : (
                      <>
                        <span>🤖</span> Evaluate Logic with AI Reviewer
                      </>
                    )}
                  </button>
                </div>

                {/* AI Logic Feedback Card */}
                {logicEvaluation && (
                  <div className="bg-slate-50 dark:bg-slate-950 border-2 border-indigo-300 dark:border-indigo-500/40 p-5 rounded-2xl space-y-3 animate-fade-in shadow-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300">
                        {logicEvaluation.verdict}
                      </span>
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                        Score: {logicEvaluation.logicScore}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {logicEvaluation.constructiveFeedback}
                    </p>

                    {logicEvaluation.overlookedEdgeCases?.length > 0 && (
                      <div className="bg-amber-50 dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                          ⚠️ Watch Out For These Edge Cases:
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {logicEvaluation.overlookedEdgeCases.join(' • ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PROGRESSIVE HINTS & FULL SOLUTION */}
            {activeLeftTab === 'hints' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 p-4 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">Progressive Clues & Solution</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">Unlock hints tier by tier without spoiling the full solution immediately.</p>
                  </div>
                  <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/30">
                    {unlockedHintLevel} / 4 Unlocked
                  </span>
                </div>

                {hintsList.map((hint, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1.5 text-xs animate-fade-in">
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 text-xs block">{hint.hintTitle}</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{hint.hintText}</p>
                  </div>
                ))}

                {unlockedHintLevel < 4 && (
                  <button
                    onClick={handleUnlockNextHint}
                    disabled={loadingHint}
                    className="w-full bg-amber-50 dark:bg-slate-950 hover:bg-amber-100 dark:hover:bg-slate-900 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold text-xs py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loadingHint ? 'Unlocking...' : `💡 Unlock Next Clue (Hint ${unlockedHintLevel + 1})`}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ================= RIGHT COLUMN: CODE EDITOR & TEST RESULTS ================= */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-auto min-h-[480px] lg:h-[750px]">
          
          {/* Editor Header Bar */}
          <div className="bg-slate-100 dark:bg-slate-950 p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Language:</span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer shadow-sm"
              >
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="python">Python 3</option>
                <option value="java">Java 17</option>
                <option value="cpp">C++ 20</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCode}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-300 dark:border-slate-800 shadow-sm"
              >
                ↺ Reset
              </button>
              
              <button
                onClick={() => handleRunCode(false)}
                disabled={isRunningCode}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-sm hover:scale-105"
              >
                <span>⚡</span> Run Code
              </button>

              <button
                onClick={() => handleRunCode(true)}
                disabled={isRunningCode}
                className="btn-shine bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5 hover:scale-105"
              >
                {isRunningCode ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span> Submit Solution
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Code Editor Area */}
          <div className="flex-1 min-h-[240px] sm:min-h-[280px] bg-slate-50 dark:bg-slate-950 p-4 font-mono text-xs flex flex-col relative overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Write your code here..."
              spellCheck="false"
              className="w-full h-full min-h-[220px] sm:min-h-[260px] bg-transparent text-slate-900 dark:text-slate-200 resize-none outline-none font-mono text-xs leading-relaxed selection:bg-indigo-600 selection:text-white"
            />
          </div>

          {/* Execution Results & Test Cases Console */}
          <div className="h-64 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col">
            
            {/* Results Header Tabs */}
            <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-2 uppercase tracking-wider">Test Cases:</span>
                {(executionResult?.testResults || selectedProblem?.sampleTestCases || []).map((tc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTestCaseTab(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                      activeTestCaseTab === idx
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tc.passed !== undefined && (
                      <span className={tc.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {tc.passed ? '✓' : '✕'}
                      </span>
                    )}
                    <span>Case {idx + 1}</span>
                    {tc.isHidden && <span className="text-[9px] text-slate-400 dark:text-slate-500">(Hidden)</span>}
                  </button>
                ))}
              </div>

              {executionResult && (
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                    executionResult.status === "Accepted"
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                  }`}>
                    {executionResult.status} ({executionResult.passedCount}/{executionResult.totalTestCases})
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    ⏱️ {executionResult.runtimeMs}ms
                  </span>
                </div>
              )}
            </div>

            {/* Test Case Detail View */}
            <div className="flex-1 p-4 overflow-y-auto text-xs font-mono space-y-2.5 bg-slate-50 dark:bg-slate-900">
              {(() => {
                const currentCases = executionResult?.testResults || selectedProblem?.sampleTestCases || [];
                const currentCase = currentCases[activeTestCaseTab] || currentCases[0];

                if (!currentCase) {
                  return <p className="text-slate-500 text-xs italic">Click 'Run Code' to execute against sample test cases.</p>;
                }

                return (
                  <div className="space-y-2">
                    <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                      <span className="text-[10px] font-sans font-bold text-slate-600 dark:text-slate-400 block mb-0.5">Input:</span>
                      <span className="text-slate-800 dark:text-slate-200">{JSON.stringify(currentCase.input)}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-[10px] font-sans font-bold text-slate-600 dark:text-slate-400 block mb-0.5">Expected Output:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{JSON.stringify(currentCase.expected)}</span>
                      </div>

                      <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-[10px] font-sans font-bold text-slate-600 dark:text-slate-400 block mb-0.5">Actual Output:</span>
                        <span className={currentCase.passed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                          {currentCase.actual !== undefined ? JSON.stringify(currentCase.actual) : '[Run Code to Evaluate]'}
                        </span>
                      </div>
                    </div>

                    {currentCase.logs?.length > 0 && (
                      <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 shadow-xs">
                        <strong className="text-indigo-600 dark:text-indigo-300 font-sans block mb-0.5">Console Output:</strong>
                        <p>{currentCase.logs.join('\n')}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

          </div>

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
                Coding Exam Violation #{tabSwitches}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Tab Switch Detected!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                You navigated away from the coding exam at <strong className="text-slate-900 dark:text-white">{lastViolationTime}</strong>. All tab changes and editor unfocus events are recorded and reported to recruiters & administrators.
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
                <li>Remain in the code editor window during timed tests.</li>
                <li>External browser lookups and AI copilot usage outside this arena are forbidden.</li>
                <li>Repeated violations degrade candidate technical integrity score.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setShowTabWarningModal(false);
                document.title = 'CampusEdge - Coding Arena';
              }}
              className="w-full py-3.5 rounded-xl font-black text-xs bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              I Understand & Resume Coding Exam ➔
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN RE-ENTRY REQUIRED BARRIER MODAL */}
      <FullscreenBarrierModal
        isOpen={showFullscreenBarrier}
        onReEnterFullscreen={handleReEnterFullscreen}
        title="Timed Coding Examination"
      />

      {/* TWO-STEP EXIT VERIFICATION MODAL */}
      <TwoStepExitModal
        isOpen={showTwoStepExitModal}
        onClose={() => {
          setShowTwoStepExitModal(false);
          setPendingExitAction(null);
        }}
        onConfirmExit={handleConfirmForfeitCodingTest}
        testTitle="Timed Coding Examination"
        tabSwitches={tabSwitches}
      />

      {/* DISQUALIFICATION MODAL ON 3-STRIKES */}
      <DisqualificationModal
        isOpen={showDisqualificationModal}
        onAcknowledge={() => {
          setShowDisqualificationModal(false);
          setArenaMode('practice');
        }}
        testTitle="Timed Coding Examination"
        tabSwitches={tabSwitches}
        violationLogs={tabSwitchLogs}
      />

    </div>
  );
}
