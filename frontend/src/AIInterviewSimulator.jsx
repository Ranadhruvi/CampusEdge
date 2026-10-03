import { streakManager } from './streakManager';
import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from './api';
import { useToast } from './Toast';
import { 
  playProctorAlertChime, 
  sendSystemProctorNotification, 
  requestNotificationPermission, 
  enterFullscreenMode, 
  exitFullscreenMode 
} from './proctorUtils';
import TwoStepExitModal from './TwoStepExitModal';
import FullscreenBarrierModal from './FullscreenBarrierModal';
import DisqualificationModal from './DisqualificationModal';

const STREAMS_AND_ROLES = [
  {
    id: "cs_it",
    name: "Computer Science & Information Technology",
    icon: "💻",
    desc: "Software systems, web architectures, cloud, backend & security",
    roles: [
      "Software Engineer",
      "Full Stack Developer",
      "Frontend Developer (React/Next)",
      "Backend Developer (Node/Python/Java)",
      "Cloud & DevOps Engineer",
      "Cybersecurity Analyst",
      "QA Automation Engineer",
      "Database Administrator"
    ]
  },
  {
    id: "ai_ds",
    name: "AI, Data Science & Analytics",
    icon: "🤖",
    desc: "Machine learning models, analytics, GenAI & big data pipelines",
    roles: [
      "Data Scientist",
      "Machine Learning Engineer",
      "Generative AI & LLM Specialist",
      "Data Analyst",
      "Data Engineer",
      "Computer Vision Engineer",
      "NLP Engineer"
    ]
  },
  {
    id: "ece_vlsi",
    name: "Electronics & Communication (ECE / VLSI)",
    icon: "⚡",
    desc: "Embedded firmware, microcontrollers, IoT devices & hardware design",
    roles: [
      "Embedded Systems Engineer",
      "IoT Solutions Engineer",
      "VLSI Design & Verification Engineer",
      "Robotics & Automation Engineer",
      "Firmware Developer",
      "Hardware Test Engineer"
    ]
  },
  {
    id: "eee_power",
    name: "Electrical Engineering (EEE & Power)",
    icon: "🔌",
    desc: "Power grids, EV powertrain, battery management, renewable energy & drives",
    roles: [
      "Power Systems Engineer",
      "EV & Battery Management Engineer",
      "Renewable Energy Analyst",
      "Control Systems Specialist",
      "Electrical Design Engineer"
    ]
  },
  {
    id: "mech_auto",
    name: "Mechanical, Automobile & Production",
    icon: "⚙️",
    desc: "Design analysis, CAD/CAM, thermal systems & industrial manufacturing",
    roles: [
      "Mechanical Design Engineer (CAD/SolidWorks)",
      "Automotive Systems Engineer",
      "Industrial & Automation Engineer",
      "Thermal & Fluids Specialist",
      "Manufacturing Operations Engineer",
      "HVAC Design Engineer"
    ]
  },
  {
    id: "civil_struct",
    name: "Civil, Structural & Environmental",
    icon: "🏗️",
    desc: "Building information modeling (BIM), structural engineering & site planning",
    roles: [
      "Structural Design Engineer",
      "BIM & AutoCAD Modeler",
      "Construction Site & Project Engineer",
      "Geotechnical Analyst",
      "Environmental & Water Resource Engineer"
    ]
  },
  {
    id: "chem_bio",
    name: "Chemical, Biotech & Pharma",
    icon: "🧬",
    desc: "Process engineering, biochemical analysis, clinical research & pharma QC",
    roles: [
      "Process Engineering Associate",
      "Biochemical & Quality Analyst",
      "Clinical Research Associate",
      "Pharma R&D Specialist",
      "Environmental Safety & QC Officer"
    ]
  },
  {
    id: "mgmt_biz",
    name: "Business, Product & Management (MBA)",
    icon: "💼",
    desc: "Product roadmap, business strategy, financial modeling & HR recruitment",
    roles: [
      "Technical Product Manager",
      "Business Analyst",
      "Management Trainee",
      "Financial Analyst",
      "Marketing & Growth Specialist",
      "HR Talent Acquisition Specialist",
      "Operations & Strategy Analyst"
    ]
  },
  {
    id: "ui_ux",
    name: "UI/UX Design & Digital Media",
    icon: "🎨",
    desc: "User experience research, Figma wireframing, design systems & creative design",
    roles: [
      "UI/UX Designer",
      "Product Designer",
      "Interaction & Visual Designer",
      "Graphic & Brand Identity Designer"
    ]
  },
  {
    id: "custom",
    name: "Custom / Any Other Academic Field",
    icon: "✨",
    desc: "Type any custom academic discipline or niche career role below",
    roles: [
      "Custom Role (Type Below)"
    ]
  }
];

const COMPANY_PERSONAS = [
  {
    id: "tier1",
    name: "Google / Tier 1 Big Tech",
    icon: "🌐",
    tagline: "Scalability, Deep Problem Solving & Algorithmic Excellence",
    badgeColor: "border-indigo-500 text-indigo-400 bg-indigo-950/60"
  },
  {
    id: "amazon",
    name: "Amazon / AWS",
    icon: "📦",
    tagline: "STAR Method, Leadership Principles & Customer Obsession",
    badgeColor: "border-amber-500 text-amber-400 bg-amber-950/60"
  },
  {
    id: "mass",
    name: "TCS / Infosys / Mass Recruiter",
    icon: "🏢",
    tagline: "Core Fundamentals, Adaptability & Professional Culture Fit",
    badgeColor: "border-blue-500 text-blue-400 bg-blue-950/60"
  },
  {
    id: "startup",
    name: "High-Growth Tech Startup",
    icon: "🚀",
    tagline: "Speed, Ownership, Initiative & Full-Stack Agility",
    badgeColor: "border-purple-500 text-purple-400 bg-purple-950/60"
  }
];


const computeSpeechTelemetry = (text = '') => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of', 'kind of'];
  let fillerCount = 0;
  const lower = text.toLowerCase();
  fillers.forEach(f => {
    const matches = lower.match(new RegExp('\\b' + f + '\\b', 'g'));
    if (matches) fillerCount += matches.length;
  });
  const fillerRatio = wordCount > 0 ? (fillerCount / wordCount) : 0;
  const confidenceScore = Math.max(50, Math.min(98, Math.round(88 - (fillerRatio * 100))));
  return {
    wordCount,
    fillerCount,
    confidenceScore,
    estimatedWPM: Math.min(180, Math.max(90, Math.round(wordCount * 2.2)))
  };
};

export default function AIInterviewSimulator({ userEmail, onBack }) {
  const [roundType, setRoundType] = useState('hr'); // 'hr' | 'technical' | 'mixed'
  const [selectedStream, setSelectedStream] = useState(STREAMS_AND_ROLES[0].name);
  const [targetRole, setTargetRole] = useState(STREAMS_AND_ROLES[0].roles[0]);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [companyPersona, setCompanyPersona] = useState(COMPANY_PERSONAS[0].name);
  const [experienceLevel, setExperienceLevel] = useState('Fresher / Campus Placement');
  
  const [interviewStep, setInterviewStep] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('simulate');

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [scorecard, setScorecard] = useState(null);

  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Proctoring & Anti-Cheating Integrity State
  const [tabSwitches, setTabSwitches] = useState(0);
  const [tabSwitchLogs, setTabSwitchLogs] = useState([]);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [disqualificationLogs, setDisqualificationLogs] = useState([]);
  const [isFullscreenBarrierOpen, setIsFullscreenBarrierOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Fullscreen State & Management
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);

  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const { showSuccess, showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setSpeechSupported(false);

    if (userEmail && userEmail !== 'default@student.com') {
      fetchHistory();
    }
  }, [userEmail]);

  // Handle 3-Strikes Auto-Disqualification for AI Interview
  const handleAutoDisqualifyInterview = async (finalLogs) => {
    setIsDisqualified(true);
    const resolvedLogs = finalLogs || tabSwitchLogs;
    setDisqualificationLogs(resolvedLogs);
    setIsFullscreenBarrierOpen(false);
    setShowExitModal(false);
    stopWebcam();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    exitFullscreenMode();

    try {
      const finalRole = customRoleInput.trim() || targetRole || 'Software Engineer';
      const effectiveEmail = userEmail || 'default@student.com';
      await apiFetch('/api/interview/save-history', {
        method: 'POST',
        body: JSON.stringify({
          email: effectiveEmail,
          role: finalRole,
          stream: selectedStream,
          score: 0,
          tab_switches: 3,
          tab_switch_logs: resolvedLogs,
          feedback: transcript,
          evaluation: {
            overallScore: 0,
            recommendation: "DISQUALIFIED",
            verdict: "Auto-Disqualified due to 3 Integrity Proctoring Violations (Tab Switches)",
            hiringVerdict: "No Hire (Proctoring Disqualification)",
            feedbackMessage: "Candidate was automatically disqualified for exceeding maximum allowed browser tab switches / background multitasking during active AI HR/Technical interview."
          }
        })
      });
      fetchHistory();
    } catch (e) {
      console.warn("Failed to record auto-disqualification for interview:", e);
    }
  };

  // Live Proctoring Tab-Switch & Window Blur Monitoring Effect
  const wasAwayRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  const resetAwayTimeoutRef = useRef(null);

  useEffect(() => {
    if (interviewStep !== 'interview_room' || isDisqualified) return;

    requestNotificationPermission();

    const recordViolation = (reason) => {
      if (isDisqualified) return;
      const now = Date.now();
      // Block duplicate fires for the same away episode or within 2.5s
      if (wasAwayRef.current || (now - lastViolationTimeRef.current < 2500)) return;
      wasAwayRef.current = true;
      lastViolationTimeRef.current = now;
      if (resetAwayTimeoutRef.current) clearTimeout(resetAwayTimeoutRef.current);

      playProctorAlertChime();
      const timeStr = new Date().toLocaleTimeString();
      const logEntry = {
        violationNumber: 0,
        time: timeStr,
        timestamp: now,
        reason: reason || 'Switched tab or minimized interview window'
      };

      setTabSwitches(prev => {
        const nextCount = prev + 1;
        logEntry.violationNumber = nextCount;

        setTabSwitchLogs(prevLogs => {
          const updatedLogs = [...prevLogs, logEntry];
          if (nextCount >= 3) {
            handleAutoDisqualifyInterview(updatedLogs);
          }
          return updatedLogs;
        });

        if (nextCount === 1) {
          showWarning(`⚠️ Warning 1 of 3: Tab switch detected! Remaining chances: 2.`);
          sendSystemProctorNotification(
            '⚠️ CampusEdge AI Interview Proctoring Warning (1/3)',
            'Tab switch or window unfocus detected. You have 2 warnings left before auto-disqualification.'
          );
        } else if (nextCount === 2) {
          showError(`🚨 Warning 2 of 3: Tab switch detected! FINAL WARNING before auto-disqualification!`);
          sendSystemProctorNotification(
            '🚨 FINAL WARNING (2/3) - CampusEdge Proctoring',
            'Next tab switch or exit will immediately terminate and disqualify your interview.'
          );
        }

        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        recordViolation('Browser tab hidden / navigated away from AI interview');
      } else {
        if (resetAwayTimeoutRef.current) clearTimeout(resetAwayTimeoutRef.current);
        resetAwayTimeoutRef.current = setTimeout(() => {
          wasAwayRef.current = false;
        }, 1500);
      }
    };

    const handleWindowBlur = () => {
      recordViolation('Interview window lost focus (application switch / split screen)');
    };

    const handleWindowFocus = () => {
      if (resetAwayTimeoutRef.current) clearTimeout(resetAwayTimeoutRef.current);
      resetAwayTimeoutRef.current = setTimeout(() => {
        wasAwayRef.current = false;
      }, 1500);
    };

    const handleFullscreenChange = () => {
      const inFS = Boolean(document.fullscreenElement);
      setIsFullscreen(inFS);
      if (!inFS && interviewStep === 'interview_room' && !isDisqualified) {
        setIsFullscreenBarrierOpen(true);
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'You have an active AI interview in progress. Leaving will forfeit your session.';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (resetAwayTimeoutRef.current) clearTimeout(resetAwayTimeoutRef.current);
    };
  }, [interviewStep, isDisqualified]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await enterFullscreenMode();
        setIsFullscreen(true);
      } else {
        await exitFullscreenMode();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen toggle error:", err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const effectiveEmail = userEmail || 'default@student.com';
      const res = await apiFetch(`/api/interview/history/${effectiveEmail}`);
      if (res.ok) {
        setHistoryList(await res.json());
      }
    } catch (err) {
      console.error("Failed to load interview history:", err);
    }
    setLoadingHistory(false);
  };

  const startWebcam = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false
      });
      streamRef.current = stream;
      setMediaStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Camera access not available or denied:", err.message);
      setIsCameraActive(false);
    }
  };

  const stopWebcam = () => {
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        setMediaStream(null);
      }
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => {
            track.stop();
            track.enabled = false;
          });
          videoRef.current.srcObject = null;
        }
        try { videoRef.current.pause(); } catch(e){}
      }
    } catch (err) {
      console.warn("Error while stopping camera:", err);
    }
    setIsCameraActive(false);
  };

  // Automatically shut off camera whenever leaving the live interview room
  useEffect(() => {
    if (interviewStep !== 'interview_room') {
      stopWebcam();
    }
  }, [interviewStep]);

  // Connect active stream to video element when mounted
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive, interviewStep]);

  const toggleCamera = () => {
    if (isCameraActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")) && v.lang.startsWith("en"));
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => setIsAISpeaking(true);
      utterance.onend = () => setIsAISpeaking(false);
      utterance.onerror = () => setIsAISpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showWarning("Speech recognition is not supported in this browser. Please type your answer or use Google Chrome.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let transcriptText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcriptText += event.results[i][0].transcript;
        }
        setCurrentAnswer(prev => prev ? `${prev} ${transcriptText}` : transcriptText);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      showInfo("Microphone active — speaking to Sarah...");
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
  };

  const handleStreamChange = (streamName) => {
    setSelectedStream(streamName);
    const foundStream = STREAMS_AND_ROLES.find(s => s.name === streamName);
    if (foundStream && foundStream.roles.length > 0) {
      setTargetRole(foundStream.roles[0]);
    }
  };

  const handleStartInterview = async () => {
    const finalRole = customRoleInput.trim() || targetRole;
    if (!finalRole) {
      showWarning("Please select or enter your target job role.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/interview/generate', {
        method: 'POST',
        body: JSON.stringify({
          role: finalRole,
          stream: selectedStream,
          companyPersona: companyPersona,
          experienceLevel: experienceLevel,
          roundType: roundType
        })
      });

      const data = await res.json();
      if (res.ok && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentQuestionIndex(0);
        setTranscript([]);
        setCurrentAnswer('');
        setScorecard(null);
        setTabSwitches(0);
        setTabSwitchLogs([]);
        setIsDisqualified(false);
        setDisqualificationLogs([]);
        setIsFullscreenBarrierOpen(false);
        setShowExitModal(false);
        setInterviewStep('interview_room');

        // Auto-enter strict proctored fullscreen
        enterFullscreenMode().then(() => setIsFullscreen(true)).catch(() => {});

        startWebcam();

        const q1 = data.questions[0];
        let openingIntro = '';
        if (roundType === 'hr') {
          openingIntro = `Hello! Welcome to your ${companyPersona} HR interview for the ${finalRole} position. I'm Sarah from the HR team. Let's begin with our first question: ${q1.question}`;
        } else if (roundType === 'technical') {
          openingIntro = `Hello! Welcome to your ${companyPersona} technical assessment for the ${finalRole} position. I'm Sarah, your technical interviewer. Let's start with our first question: ${q1.question}`;
        } else {
          openingIntro = `Hello! Welcome to your ${companyPersona} placement interview for the ${finalRole} position. Let's begin: ${q1.question}`;
        }

        setTimeout(() => speakText(openingIntro), 600);
        showSuccess(`Interview room initialized for ${finalRole} (${roundType === 'hr' ? 'HR Round' : roundType === 'technical' ? 'Technical Round' : 'Comprehensive Round'})!`);
      } else {
        showError(data.message || "Failed to generate interview questions.");
      }
    } catch (err) {
      console.error("Error generating interview:", err);
      showError("Server error starting interview room.");
    }
    setLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      showWarning("Please speak or write your answer before submitting.");
      return;
    }

    stopListening();
    setLoading(true);

    const currentQ = questions[currentQuestionIndex];
    const candidateAnswer = currentAnswer.trim();

    try {
      const turnRes = await apiFetch('/api/interview/turn', {
        method: 'POST',
        body: JSON.stringify({
          role: customRoleInput.trim() || targetRole,
          stream: selectedStream,
          companyPersona: companyPersona,
          conversationHistory: transcript,
          studentAnswer: candidateAnswer,
          currentQuestionIndex: currentQuestionIndex + 1
        })
      });

      const turnData = await turnRes.json();
      const aiFeedbackMessage = turnData.aiMessage || "Thank you for that thoughtful response.";

      const updatedTranscript = [
        ...transcript,
        {
          questionId: currentQ.id,
          category: currentQ.category,
          type: currentQ.type,
          question: currentQ.question,
          studentAnswer: candidateAnswer,
          aiFeedback: aiFeedbackMessage
        }
      ];
      setTranscript(updatedTranscript);

      const nextIndex = currentQuestionIndex + 1;

      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
        setCurrentAnswer('');
        const nextQ = questions[nextIndex];
        const transitionSpeech = `${aiFeedbackMessage} Moving to Question ${nextIndex + 1}: ${nextQ.question}`;
        speakText(transitionSpeech);
      } else {
        stopWebcam();
        exitFullscreenMode();
        setIsFullscreen(false);
        setIsFullscreenBarrierOpen(false);
        speakText("That concludes all 5 interview rounds. I am now computing your comprehensive bar-raiser evaluation report.");
        
        const evalRes = await apiFetch('/api/interview/evaluate', {
          method: 'POST',
          body: JSON.stringify({
            role: customRoleInput.trim() || targetRole,
            stream: selectedStream,
            companyPersona: companyPersona,
            transcript: updatedTranscript
          })
        });

        const evalData = await evalRes.json();
        setScorecard(evalData);
        setInterviewStep('scorecard');

        const effectiveEmail = userEmail || 'default@student.com';
        await apiFetch('/api/interview/save-history', {
          method: 'POST',
          body: JSON.stringify({
            email: effectiveEmail,
            role: customRoleInput.trim() || targetRole,
            stream: selectedStream,
            score: evalData.overallScore || 85,
            feedback: updatedTranscript,
            evaluation: evalData,
            tab_switches: tabSwitches,
            tab_switch_logs: tabSwitchLogs
          })
        });
        fetchHistory();
        streakManager.recordActivity({
          type: 'interview',
          xp: 250,
          coins: 50,
          title: `Completed AI Bar-Raiser Interview: ${customRoleInput.trim() || targetRole} (Score: ${evalData.overallScore}/100)`
        });
        showSuccess(`Interview complete! Bar-Raiser Score: ${evalData.overallScore}/100`);
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      showError("Error recording answer exchange.");
    }
    setLoading(false);
  };
  const getVerdictBadge = (verdict = '') => {
    if (verdict.includes('Strong Hire')) return { bg: 'bg-emerald-950/80', text: 'text-emerald-400', border: 'border-emerald-500/40', label: '🌟 Strong Hire' };
    if (verdict.includes('Hire')) return { bg: 'bg-indigo-950/80', text: 'text-indigo-400', border: 'border-indigo-500/40', label: '✓ Recommended Hire' };
    if (verdict.includes('Leaning')) return { bg: 'bg-amber-950/80', text: 'text-amber-400', border: 'border-amber-500/40', label: '⚠️ Leaning Hire' };
    return { bg: 'bg-rose-950/80', text: 'text-rose-400', border: 'border-rose-500/40', label: '🔄 Needs More Practice' };
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-fade-in text-slate-900 dark:text-white font-sans space-y-8">
      
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <button 
            onClick={() => {
              stopWebcam();
              if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
              }
              if (onBack) onBack();
            }} 
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition flex items-center gap-1.5 mb-2 cursor-pointer"
          >
            ← Back to Student Dashboard
          </button>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3.5 py-1.5 rounded-full mb-2">
            <span>🎙️</span> AI Bar-Raiser Interview Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Stream-Aware AI HR & Technical Interview Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Real-time speech recognition, live webcam immersion, dynamic question generation, and recruiter scoring.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab('simulate');
              setSelectedHistoryItem(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'simulate' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🎯</span>
            <span>Interview Room</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📜</span>
            <span>History ({historyList.length})</span>
          </button>
        </div>
      </header>

      {activeTab === 'simulate' && (
        <>
          {interviewStep === 'setup' && (
            <div className="space-y-8 animate-fade-in">

              {/* Spotlight Recruiter Banner */}
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-slate-900 border border-indigo-500/30 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-indigo-400/40 shadow-2xl bg-indigo-950">
                      <img 
                        src="/ai_recruiter_sarah.jpg" 
                        alt="Sarah AI Interviewer" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 shadow-md">
                      ● LIVE AI
                    </span>
                  </div>
                  <div className="space-y-2 text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-950/80 border border-indigo-400/30 px-3 py-1 rounded-full">
                      ✨ Enterprise Placement Simulator
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Meet Sarah, Your AI Hiring Bar-Raiser
                    </h2>
                    <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
                      Practice real-time oral responses with live speech transcription, camera mirroring, and AI evaluation calibrated against Google, Amazon, and tier-1 campus hiring standards.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-[11px] font-bold text-indigo-200">
                      <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">🎙️ Voice Enabled</span>
                      <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">📹 Webcam Proctored</span>
                      <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">⚡ Instant Bar-Raiser Rubric</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ROUND TYPE SELECTION: HR vs TECHNICAL vs MIXED */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
                <div>
                  <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full mb-1.5">
                    <span>🎯</span> Choose Interview Stage
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>1️⃣</span> Select Interview Round Type
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Choose whether you want to practice standard HR behavioral screening or in-depth technical domain questions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Option 1: HR & Behavioral Round */}
                  <div
                    onClick={() => setRoundType('hr')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      roundType === 'hr'
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl'
                        : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">👔</span>
                        <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-500/30">
                          HR Round
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">HR & Behavioral Round</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                        Clear, student-friendly HR questions: Self-introduction, strengths & weaknesses, college teamwork, handling conflict, career goals, and company culture fit.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Rigor: <strong>Campus Placement Level</strong></span>
                      {roundType === 'hr' && <span className="font-black text-indigo-600 dark:text-indigo-400">Selected ✓</span>}
                    </div>
                  </div>

                  {/* Option 2: Technical Domain Round */}
                  <div
                    onClick={() => setRoundType('technical')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      roundType === 'technical'
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl'
                        : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">💻</span>
                        <span className="text-[10px] font-black uppercase text-indigo-800 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-300 dark:border-indigo-500/30">
                          Technical Round
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Technical Domain Round</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                        Stream & role-specific engineering questions: Project architecture, core fundamental concepts, practical debugging, tool choices, and future upgrades.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Rigor: <strong>Domain Fundamentals</strong></span>
                      {roundType === 'technical' && <span className="font-black text-indigo-600 dark:text-indigo-400">Selected ✓</span>}
                    </div>
                  </div>

                  {/* Option 3: Comprehensive Mixed Round */}
                  <div
                    onClick={() => setRoundType('mixed')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      roundType === 'mixed'
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl'
                        : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">🌟</span>
                        <span className="text-[10px] font-black uppercase text-purple-800 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-2.5 py-0.5 rounded-md border border-purple-300 dark:border-purple-500/30">
                          Combined
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Full Placement Round</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                        Complete simulation covering 2 HR behavioral questions + 3 technical domain questions in one unified interview session.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Rigor: <strong>HR + Technical</strong></span>
                      {roundType === 'mixed' && <span className="font-black text-indigo-600 dark:text-indigo-400">Selected ✓</span>}
                    </div>
                  </div>

                </div>
              </div>

              {/* STREAM SELECTION */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>2️⃣</span> Select Your Academic Stream / Branch
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Questions and technical scenarios will be tailored precisely to your engineering discipline.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {STREAMS_AND_ROLES.map((stream) => {
                    const isSelected = selectedStream === stream.name;
                    return (
                      <div
                        key={stream.id}
                        onClick={() => handleStreamChange(stream.name)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                            : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">{stream.icon}</span>
                          <div>
                            <h3 className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                              {stream.name}
                            </h3>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                              {stream.desc}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="mt-3 text-right">
                            <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/30">
                              Selected Stream ✓
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TARGET ROLE */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>3️⃣</span> Choose Your Target Job Role
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Select from popular specializations in {selectedStream} or type a custom job title.
                  </p>
                </div>

                {(() => {
                  const currentStreamObj = STREAMS_AND_ROLES.find(s => s.name === selectedStream) || STREAMS_AND_ROLES[0];
                  return (
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Recommended Roles for {selectedStream}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentStreamObj.roles.map((r) => {
                          const isSelected = targetRole === r && !customRoleInput.trim();
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setTargetRole(r);
                                setCustomRoleInput('');
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Or Enter Any Custom Job Title:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Systems Engineer, Quantitative Analyst, Lead Architect..."
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-2xl outline-none font-medium text-slate-900 dark:text-white text-xs sm:text-sm shadow-sm"
                  />
                </div>
              </div>

              {/* COMPANY PERSONA & EXPERIENCE LEVEL */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>4️⃣</span> Target Company Persona
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Recruiter demeanor and evaluation rigor</p>
                  </div>

                  <div className="space-y-2.5">
                    {COMPANY_PERSONAS.map((comp) => {
                      const isSelected = companyPersona === comp.name;
                      return (
                        <div
                          key={comp.id}
                          onClick={() => setCompanyPersona(comp.name)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{comp.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{comp.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{comp.tagline}</p>
                            </div>
                          </div>
                          {isSelected && <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>5️⃣</span> Experience Level
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Adjusts question complexity and scenario depth</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {["Fresher / Campus Placement", "Intern / 1-2 Yrs Experience"].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setExperienceLevel(lvl)}
                          className={`p-3.5 rounded-2xl text-xs font-bold border transition text-center cursor-pointer ${
                            experienceLevel === lvl
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        <span>Session Configuration</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">Ready</span>
                      </div>
                      <p>• Round: <strong className="text-indigo-600 dark:text-indigo-400">{roundType === 'hr' ? '👔 HR & Behavioral Round' : roundType === 'technical' ? '💻 Technical Domain Round' : '🌟 Full Placement Round'}</strong></p>
                      <p>• Role: <strong className="text-slate-900 dark:text-white">{customRoleInput.trim() || targetRole}</strong></p>
                      <p>• Stream: <strong className="text-slate-900 dark:text-white">{selectedStream}</strong></p>
                      <p>• Recruiter: <strong className="text-slate-900 dark:text-white">{companyPersona}</strong></p>
                    </div>
                  </div>

                  <button
                    onClick={handleStartInterview}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 shadow-xl shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        <span>Generating {selectedStream} Questions with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Launch Live AI Interview Room →</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}

          {interviewStep === 'interview_room' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full">
                      Round {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {customRoleInput.trim() || targetRole} &bull; <strong className="text-indigo-600 dark:text-indigo-400">{companyPersona}</strong>
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                    Category: {questions[currentQuestionIndex]?.category || "Technical Evaluation"}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {/* Proctoring Status Pill */}
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                    tabSwitches === 0 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30' 
                      : tabSwitches === 1 
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30 animate-pulse'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30 animate-bounce'
                  }`}>
                    <span>🛡️</span>
                    <span>{tabSwitches === 0 ? 'Strict Proctoring Active' : `Violations: ${tabSwitches}/3`}</span>
                  </span>

                  {/* Fullscreen Proctored Mode Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                      isFullscreen
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/40'
                        : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/40 animate-pulse'
                    }`}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Examination Mode'}
                  >
                    <span>{isFullscreen ? '🖥️' : '⛶'}</span>
                    <span className="hidden sm:inline">{isFullscreen ? 'Fullscreen' : 'Enter Fullscreen'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {questions.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-7 h-2 rounded-full transition-all duration-500 ${
                          idx < currentQuestionIndex
                            ? 'bg-emerald-500'
                            : idx === currentQuestionIndex
                              ? 'bg-indigo-500 animate-pulse'
                              : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      ></div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowExitModal(true)}
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    Leave Interview ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* AI Interviewer Avatar Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[340px]">
                  
                  <div className="flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isAISpeaking ? 'bg-emerald-500 animate-ping' : 'bg-indigo-500'}`}></span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">Sarah &bull; Senior Technical Bar-Raiser</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isAISpeaking 
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isAISpeaking ? "🎙️ Speaking..." : "👂 Listening to Candidate"}
                    </span>
                  </div>

                  <div className="my-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                      <div className={`absolute -inset-3 rounded-full transition duration-700 ${
                        isAISpeaking 
                          ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-md animate-pulse' 
                          : 'opacity-0'
                      }`}></div>
                      
                      <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 border-4 border-indigo-400/50 shadow-2xl flex items-center justify-center">
                        <img 
                          src="/ai_recruiter_sarah.jpg" 
                          alt="Sarah AI Recruiter" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{companyPersona} Hiring Panel</h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold">Specialization: {selectedStream}</p>
                    </div>

                    {isAISpeaking && (
                      <div className="flex items-center gap-1.5 h-6">
                        {[12, 24, 16, 28, 20, 14, 26, 18].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-indigo-500 rounded-full animate-pulse"
                            style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Audio Readout:</span>
                    <button
                      onClick={() => speakText(questions[currentQuestionIndex]?.question || '')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>🔊 Replay Sarah's Voice</span>
                    </button>
                  </div>
                </div>

                {/* Candidate Video Feed */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[340px]">
                  
                  <div className="flex justify-between items-center z-10 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">Candidate Video Mirror</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isListening 
                        ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isListening ? "🔴 Mic Live (Recording)" : "Mic Standby"}
                    </span>
                  </div>

                  <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[180px]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transform -scale-x-100 ${isCameraActive ? 'block' : 'hidden'}`}
                    />
                    
                    {!isCameraActive && (
                      <div className="text-center p-6 space-y-2">
                        <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-3xl mx-auto text-slate-400 shadow-xs">
                          📷
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Camera Inactive</p>
                        <p className="text-[10px] text-slate-500">Enable camera for realistic live placement simulation</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={toggleCamera}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                        isCameraActive 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{isCameraActive ? '📷 Turn Camera Off' : '📷 Enable Camera'}</span>
                    </button>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      Status: <strong className="text-slate-900 dark:text-white">{isListening ? 'Speaking' : 'Ready'}</strong>
                    </div>
                  </div>

                </div>

              </div>

              {/* Question & Answer Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                
                {questions[currentQuestionIndex] && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-500/30">
                        {questions[currentQuestionIndex].type || 'Technical'} Question &bull; #{currentQuestionIndex + 1}
                      </span>
                      {questions[currentQuestionIndex].keyHint && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                          💡 Evaluator focus: {questions[currentQuestionIndex].keyHint}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed">
                      "{questions[currentQuestionIndex].question}"
                    </h3>

                    {questions[currentQuestionIndex].expectedKeyPoints && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Key concepts to touch on:</span>
                        {questions[currentQuestionIndex].expectedKeyPoints.map((pt, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                            &bull; {pt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>✍️</span> Candidate Answer (Speak or Type):
                    </span>
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-2 ${
                        isListening
                          ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-600/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white shadow-md'
                      }`}
                    >
                      <span>{isListening ? '⏹️ Stop Speaking' : '🎙️ Speak with Microphone'}</span>
                    </button>
                  </div>

                  
                      {/* Live Speech Telemetry HUD */}
                      {currentAnswer.trim().length > 5 && (() => {
                        const tel = computeSpeechTelemetry(currentAnswer);
                        return (
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 rounded-2xl text-slate-900 dark:text-white text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 animate-fade-in font-mono shadow-xs">
                            <div className="text-center p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Words</p>
                              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{tel.wordCount}</p>
                            </div>
                            <div className="text-center p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Pacing (WPM)</p>
                              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{tel.estimatedWPM}</p>
                            </div>
                            <div className="text-center p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Filler Words</p>
                              <p className={`text-sm font-black ${tel.fillerCount > 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>{tel.fillerCount}</p>
                            </div>
                            <div className="text-center p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Confidence</p>
                              <p className="text-sm font-black text-cyan-600 dark:text-cyan-400">{tel.confidenceScore}%</p>
                            </div>
                          </div>
                        );
                      })()}

                    <textarea
                    rows={4}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Speak into your microphone or type your structured answer here. Include specific technologies, STAR situation details, and quantified results..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-2xl outline-none font-medium text-slate-900 dark:text-white text-xs sm:text-sm resize-none leading-relaxed shadow-sm"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={loading || !currentAnswer.trim()}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 shadow-xl shadow-indigo-600/25 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        <span>Evaluating Response with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <span>{currentQuestionIndex + 1 === questions.length ? '🏁 Submit Final Answer & View Scorecard' : 'Next Question Round →'}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}

          {interviewStep === 'scorecard' && scorecard && (
            <div className="space-y-8 animate-fade-in">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                
                <div className="flex flex-col items-center text-center justify-center lg:border-r lg:border-slate-200 dark:lg:border-slate-800 lg:pr-8">
                  {(() => {
                    const score = scorecard.overallScore || 85;
                    const radius = 64;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (score / 100) * circumference;

                    return (
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                          <circle cx="80" cy="80" r={radius} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="12" fill="transparent" />
                          <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke={score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : '#f59e0b'}
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-4xl font-black text-slate-900 dark:text-white">{score}</span>
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">/ 100 Score</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-4">
                    {(() => {
                      const badge = getVerdictBadge(scorecard.verdict);
                      return (
                        <span className={`text-xs font-black px-3.5 py-1.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {scorecard.verdict || "Strong Hire"}
                        </span>
                      );
                    })()}
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
                      Audited for: <strong className="text-slate-900 dark:text-white">{customRoleInput.trim() || targetRole}</strong>
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Executive Recruiter Evaluation &bull; {companyPersona}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Stream: <strong className="text-slate-900 dark:text-white">{selectedStream}</strong>
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      {scorecard.detailedFeedback || "Candidate demonstrated commendable composure, solid foundational technical principles, and structured problem solving."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-400">Communication</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{scorecard.communicationScore || 85}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${scorecard.communicationScore || 85}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-400">Technical Depth</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{scorecard.technicalScore || 82}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${scorecard.technicalScore || 82}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-400">STAR Structure</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{scorecard.behavioralScore || 88}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${scorecard.behavioralScore || 88}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-base font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <span>🌟</span> Key Candidate Strengths
                  </h3>
                  <div className="space-y-3">
                    {(scorecard.keyStrengths || []).map((st, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-500/20 flex items-start gap-3">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">✓</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{st}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-base font-black text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <span>📈</span> Actionable Areas to Polish
                  </h3>
                  <div className="space-y-3">
                    {(scorecard.areasForImprovement || []).map((imp, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-amber-300 dark:border-amber-500/20 flex items-start gap-3">
                        <span className="text-amber-600 dark:text-amber-400 font-black text-sm">⚡</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{imp}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Full Interview Transcript & Recruiter Remarks</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Review each question, your transcribed response, and Sarah's live feedback.</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{transcript.length} Rounds Logged</span>
                </div>

                <div className="space-y-4">
                  {transcript.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-300 dark:border-indigo-500/30">
                          Round #{idx + 1} &bull; {item.category || "Scenario"}
                        </span>
                      </div>

                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">Interviewer Question:</p>
                        <p className="text-slate-900 dark:text-white font-bold text-sm mt-0.5">"{item.question}"</p>
                      </div>

                      <div className="bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Candidate Response:</p>
                        <p className="text-slate-800 dark:text-slate-200 mt-1 font-medium leading-relaxed">{item.studentAnswer}</p>
                      </div>

                      {item.aiFeedback && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
                          <p className="text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">Sarah's Dialogue Observation:</p>
                          <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">{item.aiFeedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setInterviewStep('setup');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition cursor-pointer"
                  >
                    🔄 Practice Another Interview Session →
                  </button>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Historical Interview Audits ({historyList.length})</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Review your past performance, verdict trends, and feedback across streams.</p>
            </div>
            <button 
              onClick={fetchHistory} 
              className="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 cursor-pointer"
            >
              Refresh 🔄
            </button>
          </div>

          {loadingHistory ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-slate-600 dark:text-slate-400 font-bold text-xs">Loading recorded sessions...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs space-y-2 shadow-sm">
              <span className="text-3xl block">🎙️</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">No completed interviews recorded yet.</p>
              <p>Launch an interview room to test your speech recognition and recruiter readiness!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyList.map((item, idx) => {
                const isSelected = selectedHistoryItem && selectedHistoryItem.id === item.id;
                const score = item.score || 85;
                const verdictBadge = getVerdictBadge(item.evaluation?.verdict || "Strong Hire");

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedHistoryItem(item)}
                    className={`p-6 rounded-3xl border transition cursor-pointer space-y-4 shadow-sm ${
                      isSelected 
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30' 
                        : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-1 rounded-md uppercase">
                        {item.stream || 'Engineering'}
                      </span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${verdictBadge.bg} ${verdictBadge.text} ${verdictBadge.border}`}>
                        {score}/100 Score
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{item.role}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Recorded on: <strong className="text-slate-700 dark:text-slate-300">{new Date(item.created_at).toLocaleDateString()}</strong> &bull; {item.feedback?.length || 5} Questions
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.evaluation?.detailedFeedback || "Candidate demonstrated solid domain understanding and structured communication during interview exchanges."}
                    </p>

                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        {isSelected ? 'Viewing Breakdown ↓' : 'Inspect Full Report →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedHistoryItem && (
            <div className="bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-500/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-500/30">
                    Session Audit Archive &bull; {selectedHistoryItem.role}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedHistoryItem.stream || "Engineering"} Placement Evaluation
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Close Inspection ✕
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Recruiter Verdict Summary</span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {selectedHistoryItem.evaluation?.detailedFeedback || "Completed simulation session."}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Recorded Exchanges</h4>
                {(selectedHistoryItem.feedback || []).map((ex, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">Q{i+1}: {ex.question}</p>
                    <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">Ans: {ex.studentAnswer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Fullscreen Barrier Modal */}
      <FullscreenBarrierModal
        isOpen={isFullscreenBarrierOpen && interviewStep === 'interview_room' && !isDisqualified}
        onReEnterFullscreen={async () => {
          await enterFullscreenMode();
          setIsFullscreen(true);
          setIsFullscreenBarrierOpen(false);
        }}
        onForfeit={() => {
          setIsFullscreenBarrierOpen(false);
          setShowExitModal(true);
        }}
        assessmentTitle="AI Interview Simulator"
      />

      {/* Two-Step Verification Exit Modal */}
      <TwoStepExitModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirmExit={() => {
          setShowExitModal(false);
          stopWebcam();
          exitFullscreenMode();
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          setInterviewStep('setup');
          showInfo("Interview session ended.");
        }}
        testTitle="AI Interview Simulator"
        forfeitWarning="Exiting now will forfeit your interview session and no final score will be awarded."
      />

      {/* 3-Strike Disqualification Modal */}
      <DisqualificationModal
        isOpen={isDisqualified}
        onClose={() => {
          setIsDisqualified(false);
          setInterviewStep('setup');
        }}
        violationsCount={3}
        tabLogs={disqualificationLogs}
        assessmentTitle="AI Interview Simulator"
      />

    </div>
  );
}