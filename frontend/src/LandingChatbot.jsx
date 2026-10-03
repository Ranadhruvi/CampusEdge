import React, { useState, useRef, useEffect } from 'react';
import { API_BASE } from './api';


const sampleQuizQuestions = [
  {
    category: "Data Structures & Algorithms",
    question: "What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctIndex: 1,
    explanation: "A balanced BST (AVL/Red-Black) halves the search space at each level, achieving O(log N) average and worst-case time."
  },
  {
    category: "Operating Systems",
    question: "Which of the following is NOT one of the four Coffman conditions necessary for a Deadlock to occur?",
    options: ["Mutual Exclusion", "Hold and Wait", "Preemption Allowed", "Circular Wait"],
    correctIndex: 2,
    explanation: "For a deadlock, 'No Preemption' is required. If preemption is allowed, resources can be reclaimed to break deadlocks."
  },
  {
    category: "JavaScript",
    question: "Which phase of the JavaScript Event Loop processes Promise callbacks (`.then()`, `async/await`)?",
    options: ["Macrotask Queue", "Microtask Queue", "Render Queue", "Call Stack directly"],
    correctIndex: 1,
    explanation: "Promise resolutions and `queueMicrotask` run in the Microtask queue, executing immediately after the current script and before rendering or timers."
  },
  {
    category: "Database Management & SQL",
    question: "What does the 'I' stand for in the ACID properties of database transactions?",
    options: ["Integrity", "Isolation", "Indexing", "Idempotence"],
    correctIndex: 1,
    explanation: "Isolation ensures concurrent transactions execute without interfering with one another, avoiding dirty reads and phantom reads."
  }
];

const roleBlueprints = {
  'fullstack': {
    title: 'Full Stack Software Engineer',
    package: '10 - 35 LPA',
    difficulty: 'High',
    keySkills: ['React/Next.js', 'Node.js/FastAPI', 'PostgreSQL', 'System Design', 'DSA'],
    focusTip: 'Focus on full-duplex WebSockets, SQL optimization, and clean microservices architecture.'
  },
  'backend': {
    title: 'Backend Systems Engineer',
    package: '12 - 40 LPA',
    difficulty: 'Very High',
    keySkills: ['Java/Go/Python', 'Distributed Caching (Redis)', 'Kafka/RabbitMQ', 'Docker/K8s', 'Database Internals'],
    focusTip: 'Master concurrency, ACID transaction isolation levels, and high-throughput low-latency APIs.'
  },
  'frontend': {
    title: 'Modern Frontend Specialist',
    package: '8 - 28 LPA',
    difficulty: 'Medium - High',
    keySkills: ['React 18/Fiber', 'TypeScript', 'State Management (Zustand/Redux)', 'Web Vitals (LCP/CLS)', 'TailwindCSS'],
    focusTip: 'Emphasize component reconciliation, SSR/SSG rendering pipelines, and accessible UX patterns.'
  },
  'devops': {
    title: 'Cloud & DevOps Engineer',
    package: '11 - 38 LPA',
    difficulty: 'High',
    keySkills: ['Docker Multi-Stage', 'Kubernetes (Deployments/PVCs)', 'Terraform IaC', 'CI/CD Pipelines', 'Prometheus'],
    focusTip: 'Demonstrate automated canary deployments, zero-downtime rolling updates, and container security.'
  }
};

export default function LandingChatbot({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi there! 👋 I am your CampusEdge AI Career & Placement Advisor. How can I help you accelerate your interview preparation today?',
      action: null,
      quiz: null,
      blueprint: null,
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const quickPrompts = [
    { label: '🎯 Quick AI Placement Quiz', query: 'quiz' },
    { label: '💼 Career Salary Blueprint', query: 'blueprint' },
    { label: '📄 ATS Resume Scanner', query: 'How does the ATS scanner work?' },
    { label: '🧠 2,050+ Question Bank', query: 'What subjects are in the Question Bank?' },
    { label: '🎙️ AI Voice HR Simulator', query: 'How do AI Mock Interviews work?' }
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

  const getBotResponse = (userQuery) => {
    const q = userQuery.toLowerCase();
    
    // Interactive Quiz Trigger
    if (q === 'quiz' || q.includes('quiz') || q.includes('test me') || q.includes('practice question')) {
      const randomQ = sampleQuizQuestions[Math.floor(Math.random() * sampleQuizQuestions.length)];
      return {
        text: `🎯 Here is an interactive interview question from "${randomQ.category}":`,
        quiz: {
          ...randomQ,
          userSelected: null,
          isAnswered: false
        },
        action: null
      };
    }

    // Interactive Career Blueprint Trigger
    if (q === 'blueprint' || q.includes('salary') || q.includes('package') || q.includes('role career') || q.includes('blueprint')) {
      return {
        text: "💼 Select a target engineering career track to view campus placement packages and key skills required:",
        blueprint: {
          selectedRole: 'fullstack',
          data: roleBlueprints
        },
        action: null
      };
    }

    if (q.includes('resume') || q.includes('ats') || q.includes('score') || q.includes('scanner')) {
      return {
        text: "Our ATS Resume Scanner parses your PDF resume in real time, computes a match score out of 100, detects required keywords, and flags missing tech competencies for Software Engineering roles.",
        action: { label: 'Upload & Scan Resume ➔', actionType: 'scroll_ats' }
      };
    } else if (q.includes('mock') || q.includes('test') || q.includes('question') || q.includes('bank') || q.includes('subject')) {
      return {
        text: "CampusEdge features 2,052+ strictly unique questions across 17 technical subjects including DSA, OS, Networks, DBMS, System Design, React, Java, Python, C++, and Aptitude with live countdown timers and explanations.",
        action: { label: 'Explore 2,050+ Questions ➔', actionType: 'register' }
      };
    } else if (q.includes('interview') || q.includes('hr') || q.includes('voice') || q.includes('speech') || q.includes('simulator')) {
      return {
        text: "The AI Live Voice HR Simulator conducts realistic 5-round spoken interviews. It listens to your voice, asks contextual technical follow-ups, and produces instant communication & technical feedback scores!",
        action: { label: 'Try AI Voice Interview Simulator ➔', actionType: 'register' }
      };
    } else if (q.includes('drive') || q.includes('placement') || q.includes('company') || q.includes('eligibility') || q.includes('apply')) {
      return {
        text: "Placement Officers post active campus recruitment circulars directly on the platform. Students can check CGPA criteria, download notice PDFs, and submit registration confirmations.",
        action: { label: 'View Placement Drives ➔', actionType: 'register' }
      };
    } else if (q.includes('signup') || q.includes('register') || q.includes('login') || q.includes('account') || q.includes('free') || q.includes('price')) {
      return {
        text: "CampusEdge is 100% free for all university students! You can create an account in 10 seconds or sign in instantly with Google.",
        action: { label: 'Create Free Account ➔', actionType: 'register' }
      };
    } else {
      return {
        text: "CampusEdge provides an end-to-end university placement ecosystem: 2,050+ verified mock test questions, live AI voice interviews, instant ATS resume audits, and direct campus recruitment notices.",
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
      const response = await fetch(`${API_BASE}/api/chatbot/message`, {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },
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
    } else if (action.actionType === 'scroll_ats') {
      const el = document.getElementById('analyzer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
      } else if (onNavigate) {
        onNavigate('register');
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
        text: 'Chat cleared! How can I assist with your placement prep today?',
        action: null,
        quiz: null,
        blueprint: null,
        time: 'Just now'
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Animated Trigger Button */}
      {!isOpen && (
        <div className="relative group">
          {/* Attention Tooltip */}
          <div className="absolute -top-10 right-0 bg-slate-900 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold py-1 px-3 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
            💬 Have placement questions? Chat with AI!
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 flex items-center gap-2.5 font-black text-xs cursor-pointer border border-indigo-400/40 group shadow-indigo-600/30"
            aria-label="Open AI Career Advisor Chat"
          >
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base shadow-inner">
              🤖
            </span>
            <span className="hidden sm:inline tracking-tight text-sm">
              Ask AI Career Advisor
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          </button>
        </div>
      )}

      {/* Modern Interactive Glassmorphic Chat Window */}
      {isOpen && (
        <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/90 rounded-3xl shadow-2xl w-[92vw] sm:w-[400px] md:w-[430px] flex flex-col h-[560px] overflow-hidden animate-fade-in text-slate-900 dark:text-white transition-all font-sans">
          
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
                  <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded-full font-bold">Interactive</span>
                </h3>
                <p className="text-[10px] text-indigo-100 font-medium">Placement Guidance Engine &bull; Online</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-100 flex items-center justify-center text-xs transition cursor-pointer"
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

          {/* Quick Prompts Bar */}
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

                <div className={`max-w-[85%] space-y-2`}>
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed shadow-sm font-medium ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs font-semibold'
                        : 'bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="flex-1">{msg.text}</p>
                      {msg.sender === 'bot' && (
                        <button
                          onClick={() => handleSpeakMessage(msg.text)}
                          title="Read out loud"
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs transition cursor-pointer flex-shrink-0"
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
              placeholder="Ask a question or try 'quiz', 'salary', 'ATS'..."
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