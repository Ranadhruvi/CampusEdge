import React, { useState, useRef, useEffect } from 'react';
import { API_BASE, apiFetch } from './api';

const sampleQuizQuestions = [
  {
    category: "Data Structures & Algorithms",
    question: "What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctIndex: 1,
    explanation: "A balanced BST (AVL/Red-Black) halves the search space at each level, achieving O(log N) average and worst-case search time."
  },
  {
    category: "Operating Systems",
    question: "Which of the following is NOT one of the four Coffman conditions necessary for a Deadlock to occur?",
    options: ["Mutual Exclusion", "Hold and Wait", "Preemption Allowed", "Circular Wait"],
    correctIndex: 2,
    explanation: "For a deadlock to occur, 'No Preemption' is required. If preemption is allowed, resources can be reclaimed dynamically to prevent deadlocks."
  },
  {
    category: "JavaScript & Web Dev",
    question: "Which phase of the JavaScript Event Loop processes Promise callbacks (.then, async/await)?",
    options: ["Macrotask Queue", "Microtask Queue", "Render Queue", "Call Stack directly"],
    correctIndex: 1,
    explanation: "Promise resolutions and queueMicrotask run in the Microtask queue, executing immediately after the current script and before any timer or macrotask."
  },
  {
    category: "Database Management & SQL",
    question: "What does the 'I' stand for in the ACID properties of database transactions?",
    options: ["Integrity", "Isolation", "Indexing", "Idempotence"],
    correctIndex: 1,
    explanation: "Isolation ensures concurrent database transactions execute without interfering with one another, preventing dirty reads and non-repeatable reads."
  },
  {
    category: "Computer Networks",
    question: "Which protocol is connectionless and does not guarantee packet delivery or ordering?",
    options: ["TCP", "UDP", "HTTP", "BGP"],
    correctIndex: 1,
    explanation: "UDP (User Datagram Protocol) is lightweight and connectionless, prioritizing speed and low latency over guaranteed reliability."
  }
];

const roleBlueprints = {
  'fullstack': {
    title: 'Full Stack Software Engineer',
    package: '10 - 35 LPA',
    difficulty: 'High',
    keySkills: ['React / Next.js', 'Node.js / Express', 'PostgreSQL / MongoDB', 'System Design', 'DSA'],
    focusTip: 'Master clean API design, database indexing, state management, and containerized deployments.'
  },
  'backend': {
    title: 'Backend Systems Engineer',
    package: '12 - 40 LPA',
    difficulty: 'Very High',
    keySkills: ['Java / Go / Python', 'Distributed Caching (Redis)', 'Kafka / RabbitMQ', 'Docker / K8s', 'Database Internals'],
    focusTip: 'Master concurrency, ACID transaction isolation, and high-throughput low-latency architectures.'
  },
  'frontend': {
    title: 'Modern Frontend Specialist',
    package: '8 - 28 LPA',
    difficulty: 'Medium - High',
    keySkills: ['React 19 / TypeScript', 'State Architecture', 'Web Performance & Vitals', 'TailwindCSS', 'Accessibility'],
    focusTip: 'Emphasize component lifecycle, responsive mobile viewports, and efficient client-side caching.'
  },
  'devops': {
    title: 'Cloud & DevOps Engineer',
    package: '11 - 38 LPA',
    difficulty: 'High',
    keySkills: ['Docker Multi-Stage', 'Kubernetes (Deployments/Ingress)', 'Terraform / IaC', 'CI/CD Pipelines', 'AWS / GCP'],
    focusTip: 'Demonstrate automated CI/CD pipelines, zero-downtime rolling updates, and container observability.'
  }
};

export default function LandingChatbot({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Welcome to CampusEdge! I'm your AI Campus Placement Advisor.\n\nWhether you're a new student wondering how to get started, preparing for top recruiters (Google, Amazon, TCS, etc.), or exploring our 100% free practice tests, coding arena, and ATS resume scanner — ask me anything!",
      action: { label: 'Explore Platform Features ➔', actionType: 'scroll_demo' },
      quiz: null,
      blueprint: null,
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  // Proactive greeting teaser for new visitors
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTeaser(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setShowTeaser(false);
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const quickPrompts = [
    { label: '🚀 What is CampusEdge?', query: 'What is CampusEdge and how does it help a new student?' },
    { label: '💰 Is it 100% Free?', query: 'Is CampusEdge completely free to use?' },
    { label: '🎯 Practice Placement Quiz', query: 'quiz' },
    { label: '📄 ATS Resume Scanner', query: 'How does the ATS resume scanner work?' },
    { label: '🎙️ AI Voice HR Simulator', query: 'How do AI Mock Interviews work?' },
    { label: '💻 Live Code Compiler', query: 'What languages does the coding arena support?' },
    { label: '🏢 Top Recruiters (Google/TCS)', query: 'How does CampusEdge help prepare for companies like Google and TCS?' },
    { label: '💼 Career Salary Blueprint', query: 'blueprint' }
  ];

  const handleSpeakMessage = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[🤖📄🧠🎙️🏢🚀✨🎯💡👍]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // High-accuracy fallback knowledge generator
  const getBotResponse = (userQuery) => {
    const q = userQuery.toLowerCase();
    
    // Interactive Quiz Trigger
    if (q === 'quiz' || q.includes('quiz') || q.includes('test me') || q.includes('practice question') || q.includes('ask me a question')) {
      const randomQ = sampleQuizQuestions[Math.floor(Math.random() * sampleQuizQuestions.length)];
      return {
        text: `🎯 Here is an interactive technical interview question from "${randomQ.category}":`,
        quiz: {
          ...randomQ,
          userSelected: null,
          isAnswered: false
        },
        action: null
      };
    }

    // Interactive Career Blueprint Trigger
    if (q === 'blueprint' || q.includes('salary') || q.includes('package') || q.includes('role career') || q.includes('ctc')) {
      return {
        text: "💼 Select a target engineering career track to view campus placement packages and essential skills required:",
        blueprint: {
          selectedRole: 'fullstack',
          data: roleBlueprints
        },
        action: { label: 'Create Free Account to Start ➔', actionType: 'register' }
      };
    }

    if (q.includes('what is') || q.includes('about') || q.includes('how does it work') || q.includes('new student') || q.includes('start') || q.includes('help')) {
      return {
        text: "CampusEdge is an all-in-one placement preparation workspace built specifically for university students!\n\nHere is how it accelerates your career:\n• 1,000+ Verified MCQ Mock Tests with countdown timers & explanations\n• AI Speech HR Mock Interview simulator that grades spoken clarity & tech depth\n• Instant ATS Resume Audit scored against Fortune 500 job standards\n• Browser Coding Arena supporting Python, C++, Java, and JavaScript\n• Live Campus Recruitment Circulars with CGPA cutoffs & deadlines.",
        action: { label: 'Create Free Account in 10s ➔', actionType: 'register' }
      };
    } else if (q.includes('free') || q.includes('cost') || q.includes('price') || q.includes('pay') || q.includes('charge')) {
      return {
        text: "Yes, CampusEdge is 100% free for all students! There are no hidden subscription fees, paywalls, or feature locks. You can practice all mock tests, run code in the compiler, take AI voice interviews, and scan your resume completely free.",
        action: { label: 'Register Free Now ➔', actionType: 'register' }
      };
    } else if (q.includes('resume') || q.includes('ats') || q.includes('score') || q.includes('scanner') || q.includes('cv')) {
      return {
        text: "Our ATS Resume Scanner evaluates your PDF resume against real corporate recruitment benchmarks (Google, Microsoft, Amazon).\n\nIt computes an overall match score out of 100, verifies industry technical keywords, and flags missing skills or formatting issues that could cause recruiter rejection.",
        action: { label: 'Try ATS Resume Audit ➔', actionType: 'scroll_ats' }
      };
    } else if (q.includes('interview') || q.includes('hr') || q.includes('voice') || q.includes('speech') || q.includes('simulator')) {
      return {
        text: "The AI Voice Mock Interview Simulator conducts realistic spoken interview rounds! It listens to your voice answers, asks dynamic technical follow-ups, and produces instant reports evaluating your problem-solving depth, communication clarity, and confidence.",
        action: { label: 'Preview Mock Interview ➔', actionType: 'scroll_demo' }
      };
    } else if (q.includes('mock') || q.includes('test') || q.includes('question') || q.includes('bank') || q.includes('subject') || q.includes('mcq')) {
      return {
        text: "CampusEdge features 1,000+ verified technical placement questions across 17 subjects: DSA, Operating Systems, Computer Networks, DBMS, System Design, React, Java, Python, C++, and Aptitude — each with comprehensive explanations.",
        action: { label: 'Practice Question Bank ➔', actionType: 'register' }
      };
    } else if (q.includes('code') || q.includes('compiler') || q.includes('python') || q.includes('c++') || q.includes('java') || q.includes('javascript') || q.includes('arena')) {
      return {
        text: "Our Coding Arena provides an interactive in-browser compiler supporting Python 3, C++, Java, and JavaScript. You can write algorithms, run code against custom inputs, test edge cases, and view execution runtimes in real time.",
        action: { label: 'Test Live Compiler ➔', actionType: 'scroll_demo' }
      };
    } else if (q.includes('drive') || q.includes('placement') || q.includes('company') || q.includes('eligibility') || q.includes('apply') || q.includes('circular')) {
      return {
        text: "College placement officers publish official recruitment notices directly to the platform. You can check eligible branches, minimum CGPA criteria, backlog limits, CTC salary breakdowns, and submission deadlines.",
        action: { label: 'View Placement Circulars ➔', actionType: 'register' }
      };
    } else if (q.includes('branch') || q.includes('mechanical') || q.includes('civil') || q.includes('electrical') || q.includes('ece') || q.includes('mba') || q.includes('stream')) {
      return {
        text: "CampusEdge supports students from ALL disciplines! Whether you are in CSE, IT, AI/DS, Electronics (ECE), Electrical (EEE), Mechanical, Civil, or MBA, you can prepare for General Aptitude, Logical Reasoning, Core Technical subjects, and HR interviews.",
        action: { label: 'Join Free Today ➔', actionType: 'register' }
      };
    } else if (q.includes('google') || q.includes('amazon') || q.includes('microsoft') || q.includes('tcs') || q.includes('infosys') || q.includes('wipro')) {
      return {
        text: "For Product companies (Amazon, Google, Microsoft), focus on LeetCode Medium/Hard DSA, System Design, and CS Fundamentals. For Mass Recruiters (TCS NQT, Infosys, Accenture), master Quantitative Aptitude, Logical Reasoning, and Core OOPs concepts.",
        action: { label: 'Start Focused Preparation ➔', actionType: 'register' }
      };
    } else if (q.includes('signup') || q.includes('register') || q.includes('login') || q.includes('account')) {
      return {
        text: "Creating an account takes less than 10 seconds! Simply sign up with your university email or use one-click Google Sign-In to immediately unlock your student dashboard.",
        action: { label: 'Create Free Account ➔', actionType: 'register' }
      };
    } else {
      return {
        text: "CampusEdge provides an end-to-end placement ecosystem for university students: 1,000+ verified MCQ questions, live voice AI interviews, instant ATS resume audits, multi-language code compiler, and direct campus recruitment notices.",
        action: { label: 'Get Started Free ➔', actionType: 'register' }
      };
    }
  };

  const handleSend = async (textToSend) => {
    const userMessage = (textToSend || input).trim();
    if (!userMessage) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: userMessage,
      action: null,
      quiz: null,
      blueprint: null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiFetch('/api/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: updatedHistory.slice(-8)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: data.reply || getBotResponse(userMessage).text,
            action: data.action || null,
            quiz: data.quiz ? { ...data.quiz, userSelected: null, isAnswered: false } : null,
            blueprint: userMessage.toLowerCase().includes('blueprint') || userMessage.toLowerCase().includes('salary') ? { selectedRole: 'fullstack', data: roleBlueprints } : null,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        const fallback = getBotResponse(userMessage);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: fallback.text,
            action: fallback.action || null,
            quiz: fallback.quiz || null,
            blueprint: fallback.blueprint || null,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.warn("Chatbot API fetch error, using fallback advisor:", err);
      const fallback = getBotResponse(userMessage);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: fallback.text,
          action: fallback.action || null,
          quiz: fallback.quiz || null,
          blueprint: fallback.blueprint || null,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuizAnswer = (msgId, optionIndex) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.quiz) {
        return {
          ...msg,
          quiz: {
            ...msg.quiz,
            userSelected: optionIndex,
            isAnswered: true
          }
        };
      }
      return msg;
    }));
  };

  const handleActionClick = (action) => {
    if (!action) return;
    if (action.actionType === 'register') {
      if (onNavigate) onNavigate('register');
    } else if (action.actionType === 'login') {
      if (onNavigate) onNavigate('login');
    } else if (action.actionType === 'scroll_ats') {
      const demoEl = document.getElementById('demo');
      if (demoEl) {
        demoEl.scrollIntoView({ behavior: 'smooth' });
        // Select the ATS tab inside demo if available
        const atsTabBtn = demoEl.querySelector('button');
        if (atsTabBtn) atsTabBtn.click();
        setIsOpen(false);
      } else if (onNavigate) {
        onNavigate('register');
      }
    } else if (action.actionType === 'scroll_demo') {
      const el = document.getElementById('demo');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
      }
    } else if (action.actionType === 'scroll_faq') {
      const el = document.getElementById('faq');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
      }
    }
  };

  const handleClearChat = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: 'Chat history cleared! What would you like to explore or practice next?',
        action: null,
        quiz: null,
        blueprint: null,
        time: 'Just now'
      }
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 font-sans">
      
      {/* Floating Proactive Teaser Card for New Users */}
      {!isOpen && showTeaser && (
        <div className="absolute -top-36 right-0 w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 dark:border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl animate-fade-in text-slate-800 dark:text-slate-200 z-50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
                🤖
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white">New to CampusEdge?</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTeaser(false); }} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer p-0.5"
              aria-label="Dismiss greeting"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1.5 leading-snug">
            I'm your AI Campus Placement Advisor! Ask me anything about mock tests, ATS resume audits, or top recruiter rounds.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button 
              onClick={() => { setIsOpen(true); setShowTeaser(false); }} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <span>Chat with AI</span> 💬
            </button>
            <button 
              onClick={() => { 
                setIsOpen(true); 
                setShowTeaser(false); 
                handleSend('What is CampusEdge and how do I get started?'); 
              }} 
              className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
            >
              What is this?
            </button>
          </div>
          {/* Subtle pointer triangle */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-indigo-500/30 transform rotate-45"></div>
        </div>
      )}

      {/* Floating Animated Trigger Button */}
      {!isOpen && (
        <div className="relative group">
          {/* Hover Tooltip */}
          <div className="absolute -top-10 right-0 bg-slate-900 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold py-1 px-3 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
            💬 Have placement questions? Chat with AI Advisor!
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              setShowTeaser(false);
            }}
            className="bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 flex items-center gap-2.5 font-black text-xs cursor-pointer border border-indigo-400/40 group shadow-indigo-600/30"
            aria-label="Open AI Career Advisor Chat"
          >
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base shadow-inner">
              🤖
            </span>
            <span className="hidden sm:inline tracking-tight text-sm font-black">
              Ask AI Placement Guide
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          </button>
        </div>
      )}

      {/* Modern Interactive Glassmorphic Chat Window */}
      {isOpen && (
        <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/90 rounded-3xl shadow-2xl w-[94vw] sm:w-[410px] md:w-[440px] flex flex-col h-[580px] max-h-[85vh] overflow-hidden animate-fade-in text-slate-900 dark:text-white transition-all font-sans">
          
          {/* Sleek Gradient Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-5 py-3.5 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center text-lg shadow-inner">
                  🤖
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-600 animate-pulse"></span>
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                  <span>CampusEdge AI Advisor</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Live AI</span>
                </h3>
                <p className="text-[10px] text-indigo-100 font-medium">Placement & Career Assistant &bull; 100% Free</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-100 flex items-center justify-center text-xs transition cursor-pointer"
                aria-label="Clear chat"
              >
                🔄
              </button>
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                  setIsOpen(false);
                }}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-100 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
                aria-label="Close Chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar for New Visitors */}
          <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                className="bg-white dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-400 dark:hover:border-indigo-500/50 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition cursor-pointer shadow-xs"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/80 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-1">
                    🤖
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed shadow-sm font-medium ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs font-semibold'
                        : 'bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 whitespace-pre-line">{msg.text}</div>
                      {msg.sender === 'bot' && (
                        <button
                          onClick={() => handleSpeakMessage(msg.text)}
                          title="Read out loud"
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs transition cursor-pointer flex-shrink-0 ml-1"
                        >
                          {isSpeaking ? '⏹' : '🔊'}
                        </button>
                      )}
                    </div>

                    {/* INTERACTIVE QUIZ CARD */}
                    {msg.quiz && (
                      <div className="mt-3 bg-slate-50 dark:bg-slate-950/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{msg.quiz.question}</p>
                        
                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                          {msg.quiz.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === msg.quiz.correctIndex;
                            const isSelected = msg.quiz.userSelected === oIdx;

                            let btnStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500/50';
                            if (msg.quiz.isAnswered) {
                              if (isCorrect) {
                                btnStyle = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                              } else if (isSelected && !isCorrect) {
                                btnStyle = 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500 text-rose-800 dark:text-rose-300';
                              } else {
                                btnStyle = 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={msg.quiz.isAnswered}
                                onClick={() => handleQuizAnswer(msg.id, oIdx)}
                                className={`text-left p-2 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center justify-between shadow-xs ${btnStyle}`}
                              >
                                <span><b>{String.fromCharCode(65 + oIdx)}:</b> {opt}</span>
                                {msg.quiz.isAnswered && isCorrect && <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">✓ Correct</span>}
                                {msg.quiz.isAnswered && isSelected && !isCorrect && <span className="text-rose-700 dark:text-rose-400 font-bold text-[10px]">✗ Wrong</span>}
                              </button>
                            );
                          })}
                        </div>

                        {msg.quiz.isAnswered && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-2">
                            <p className="text-slate-700 dark:text-slate-300">
                              <strong className="text-indigo-700 dark:text-indigo-400">💡 Explanation:</strong> {msg.quiz.explanation}
                            </p>
                            <button
                              onClick={() => handleSend('quiz')}
                              className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
                            >
                              Next Quiz Question ➔
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* INTERACTIVE CAREER BLUEPRINT CARD */}
                    {msg.blueprint && (
                      <div className="mt-3 bg-slate-50 dark:bg-slate-950/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(msg.blueprint.data).map(key => {
                            const item = msg.blueprint.data[key];
                            return (
                              <button
                                key={key}
                                onClick={() => handleSend(`Tell me about ${item.title}`)}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-slate-900 dark:hover:text-white font-bold text-[10px] transition cursor-pointer shadow-xs"
                              >
                                {item.title.split(' ')[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.action && (
                    <button
                      onClick={() => handleActionClick(msg.action)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-[11px] py-2.5 px-3 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 transform hover:-translate-y-0.5"
                    >
                      <span>{msg.action.label}</span>
                    </button>
                  )}

                  <div className={`text-[9px] font-semibold text-slate-400 dark:text-slate-500 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px]">
                  🤖
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-purple-600 dark:purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question or try 'What is CampusEdge?', 'quiz'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer flex-shrink-0 flex items-center justify-center"
            >
              Send ➔
            </button>
          </form>

        </div>
      )}
    </div>
  );
}