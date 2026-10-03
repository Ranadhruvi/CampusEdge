import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { useToast } from './Toast';

const POPULAR_ROLE_TRACKS = [
  { id: "fullstack", name: "Full Stack Developer (React / Node / Postgres)", icon: "🌐", category: "Software" },
  { id: "sde", name: "Software Development Engineer (SDE-1)", icon: "💻", category: "Software" },
  { id: "backend", name: "Backend / Distributed Systems Engineer", icon: "⚙️", category: "Software" },
  { id: "frontend", name: "Frontend Engineer (React / Next.js / TypeScript)", icon: "⚛️", category: "Software" },
  { id: "ai_ml", name: "AI & Machine Learning Engineer", icon: "🤖", category: "AI & Data" },
  { id: "datascientist", name: "Data Scientist & Analytics Engineer", icon: "📊", category: "AI & Data" },
  { id: "devops", name: "Cloud & DevOps Engineer (AWS / Docker / K8s)", icon: "☁️", category: "Cloud & Security" },
  { id: "cyber", name: "Cybersecurity & Security Operations Analyst", icon: "🛡️", category: "Cloud & Security" },
  { id: "embedded", name: "Embedded Systems & Firmware Engineer", icon: "⚡", category: "Core & Hardware" },
  { id: "startup", name: "Founding Full Stack Engineer (0-1 Startup)", icon: "🚀", category: "Startup" },
  { id: "tcs_prime", name: "TCS Prime / Infosys Specialist Programmer", icon: "🏢", category: "Corporate" },
  { id: "other", name: "✨ Other / Custom Role (Type Below)", icon: "✍️", category: "Custom" }
];

const STREAMS = [
  "Computer Science & Engineering",
  "Information Technology",
  "AI & Data Science",
  "Electronics & Communication (ECE)",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "MCA / BCA",
  "Other Engineering Stream"
];

const RECRUITER_TARGETS = [
  "🌟 Tier-1 Product & Big Tech (Google, Amazon, Microsoft)",
  "🦄 High-Growth Startups & Unicorns (Zomato, CRED, Swiggy, Zepto)",
  "💼 Premium Corporate Drives (TCS Prime, Infosys Specialist)",
  "🌐 General Tech & Product Companies"
];

const TIMEFRAMES = [
  { id: "30", label: "⚡ 30-Day Crash Sprint (Fast-Track Prep)" },
  { id: "60", label: "🎯 60-Day Comprehensive Track (Recommended)" },
  { id: "90", label: "🏆 90-Day Deep Mastery Track" },
  { id: "180", label: "📚 6-Month Foundation to Placement Track" }
];

export default function PlacementRoadmap({ userEmail, onBack }) {
  const [selectedRole, setSelectedRole] = useState(POPULAR_ROLE_TRACKS[0].name);
  const [customRole, setCustomRole] = useState('');
  const [stream, setStream] = useState(STREAMS[0]);
  const [targetCompany, setTargetCompany] = useState(RECRUITER_TARGETS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1].label);

  const [loading, setLoading] = useState(false);
  const [currentRoadmap, setCurrentRoadmap] = useState(null);
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'history'
  const [roadmapHistory, setRoadmapHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [completedTopics, setCompletedTopics] = useState({});
  const [fieldError, setFieldError] = useState('');

  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    if (userEmail && userEmail !== 'default@student.com') {
      fetchHistory();
    }
  }, [userEmail]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const effectiveEmail = userEmail || 'default@student.com';
      const res = await apiFetch(`/api/roadmap/history/${effectiveEmail}`);
      if (res.ok) {
        const data = await res.json();
        setRoadmapHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch roadmap history:", err);
    }
    setLoadingHistory(false);
  };

  const handlePickPreset = (preset) => {
    setSelectedRole(preset.name);
    if (preset.id === 'other') {
      setCustomRole('');
    } else {
      setCustomRole('');
    }
    setFieldError('');
  };

  const handleGenerateRoadmap = async (overrideRole) => {
    const isOther = selectedRole.includes('Other');
    const finalRole = (overrideRole || customRole.trim() || (isOther ? '' : selectedRole)).trim();
    if (!finalRole) {
      setFieldError('Target role title is required.');
      showWarning("Please specify your target job role or career track.");
      return;
    }

    setFieldError('');
    setLoading(true);
    setCurrentRoadmap(null);

    try {
      const response = await apiFetch('/api/roadmap/generate', {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail || 'default@student.com',
          role: finalRole,
          subject: finalRole,
          targetCompany,
          stream,
          timeframe,
          experienceLevel: 'Fresher / College Graduate'
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentRoadmap(data);
        showSuccess(`Generated real-time milestone roadmap for ${finalRole}!`);
        fetchHistory();
      } else {
        showError(data.message || "Failed to generate roadmap.");
      }
    } catch (err) {
      console.error("Roadmap generation error:", err);
      showError("Server error generating dynamic roadmap.");
    }
    setLoading(false);
  };

  const toggleTopicCheck = (topicKey) => {
    setCompletedTopics(prev => ({
      ...prev,
      [topicKey]: !prev[topicKey]
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7 animate-fade-in pb-16 text-slate-900 dark:text-white font-sans">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <button 
            onClick={onBack} 
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition flex items-center gap-1.5 mb-1.5 cursor-pointer"
          >
            ← Back to Student Dashboard
          </button>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full mb-1.5">
            <span>🗺️</span> Real-Time AI Placement Roadmap Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Role-Based Placement & Career Roadmap
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Generate an adaptive, multi-phase milestone curriculum tailored at run-time for any specific role and target company.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'generate' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>✨</span>
            <span>Roadmap Studio</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📜</span>
            <span>History ({roadmapHistory.length})</span>
          </button>
        </div>
      </header>

      {activeTab === 'history' ? (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Your Generated Career Roadmaps</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Click any roadmap to review its milestone phases and capstone goals.</p>
            </div>
            <button 
              onClick={() => setActiveTab('generate')} 
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              ← Back to Studio
            </button>
          </div>

          {loadingHistory ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-bold text-xs">Loading roadmap archives...</div>
          ) : roadmapHistory.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-xs">
              <span className="text-3xl block mb-2">📂</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">No roadmaps generated yet.</p>
              <p>Configure your target role in the Studio to generate your first roadmap.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmapHistory.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    setCurrentRoadmap(item);
                    setActiveTab('generate');
                  }}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 transition cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs"
                >
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">
                        {item.timeframe || '60 Days'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{item.date}</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">
                      {item.roleTitle || item.subject}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.overview}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between items-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{item.phases?.length || 4} Learning Milestones</span>
                    <span className="group-hover:translate-x-1 transition">Open Roadmap ➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          
          {/* Main Studio Controls */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
            
            {/* Quick 1-Click Role Presets */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                <span>Select Target Career Track:</span>
                <span className="text-[10px] text-slate-500 font-normal">or type a custom role below</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {POPULAR_ROLE_TRACKS.map((preset) => {
                  const isSelected = selectedRole === preset.name && !customRole;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePickPreset(preset)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              
              {/* Row 1: Target Role / Custom Role */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>💼</span> Target Role / Career Title <span className="text-rose-500">*</span>
                  </span>
                  {fieldError && (
                    <span className="text-[10px] text-rose-500 font-bold lowercase">⚠️ {fieldError}</span>
                  )}
                </label>
                <input 
                  type="text"
                  placeholder={
                    selectedRole.includes('Other')
                      ? "Type your specific or non-standard career track here (e.g. Game Engine Dev, Web3 / Blockchain, AR/VR, Quant)..."
                      : "e.g. SDE-1 (Backend), AI Prompt Engineer, Cloud DevOps, Rust Core Dev..."
                  }
                  value={selectedRole.includes('Other') ? customRole : (customRole || selectedRole)}
                  onChange={(e) => {
                    setCustomRole(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  required
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-2xl font-bold text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition ${
                    fieldError 
                      ? 'border-rose-500 ring-2 ring-rose-500/20' 
                      : selectedRole.includes('Other')
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 focus:border-indigo-400 ring-1 ring-indigo-500/30'
                        : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500'
                  }`}
                />
              </div>

              {/* Row 2: Stream & Target Recruiter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <span>🎓</span> Academic Stream / Degree
                </label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {STREAMS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <span>🏢</span> Target Recruiter Profile
                </label>
                <select
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {RECRUITER_TARGETS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Row 3: Timeframe */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <span>⏱️</span> Preparation Timeline & Track Pace
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {TIMEFRAMES.map((t) => {
                    const isSelected = timeframe === t.label;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTimeframe(t.label)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <button
              type="button"
              onClick={() => handleGenerateRoadmap()}
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition cursor-pointer text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Synthesizing Real-Time AI Milestone Curriculum with Gemini 2.5...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Generate Real-Time Placement Roadmap Now →</span>
                </>
              )}
            </button>

          </div>

          {/* Active Roadmap View */}
          {currentRoadmap && !loading && (
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-7 shadow-xl animate-fade-in">
              
              {/* Header Banner */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-3 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 mb-2">
                    <span>🎯</span> Tailored Career Track Curriculum
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentRoadmap.roleTitle || currentRoadmap.subject}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed max-w-2xl">
                    {currentRoadmap.overview}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300">
                    Target: <strong className="text-slate-900 dark:text-white">{currentRoadmap.targetCompany || targetCompany}</strong>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 rounded-xl text-indigo-800 dark:text-indigo-300 font-bold">
                    ⏱️ {currentRoadmap.timeframe || timeframe}
                  </div>
                </div>
              </div>

              {/* Recommended Tech Stack */}
              {currentRoadmap.recommendedTechStack?.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    ⚡ Core Technology Stack to Master:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {currentRoadmap.recommendedTechStack.map((tech, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 rounded-lg text-xs font-bold">
                        ✓ {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase Milestones Stepper */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span>🗺️</span> Step-by-Step Milestone Phases & Deliverables
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {currentRoadmap.phases?.map((phase, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 p-5 rounded-2xl transition space-y-3 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0">
                            {phase.phaseNumber || pIdx + 1}
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{phase.phase}</h4>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                          {phase.duration}
                        </span>
                      </div>

                      {phase.goal && (
                        <p className="text-xs text-indigo-700 dark:text-indigo-300/90 font-medium pl-8">
                          <strong>Goal:</strong> {phase.goal}
                        </p>
                      )}

                      {/* Topic Checklist */}
                      <div className="space-y-2 pl-8 pt-1">
                        {phase.topics?.map((topic, tIdx) => {
                          const topicKey = `${pIdx}_${tIdx}`;
                          const isDone = !!completedTopics[topicKey];
                          return (
                            <div 
                              key={tIdx} 
                              onClick={() => toggleTopicCheck(topicKey)}
                              className="flex items-start gap-2.5 cursor-pointer group"
                            >
                              <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center text-[10px] font-bold shrink-0 transition ${
                                isDone 
                                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-indigo-500 text-transparent'
                              }`}>
                                ✓
                              </div>
                              <span className={`text-xs font-medium transition ${
                                isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                              }`}>
                                {topic}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Practical Action Box */}
                      {phase.practicalAction && (
                        <div className="ml-8 mt-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-start gap-2 text-xs">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">🛠️ Action:</span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{phase.practicalAction}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Capstone Projects Section */}
              {currentRoadmap.capstoneProjectIdeas?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <span>💡</span> Recommended Portfolio Capstone Projects for {currentRoadmap.roleTitle}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {currentRoadmap.capstoneProjectIdeas.map((proj, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 shadow-xs">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{proj.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{proj.description}</p>
                        {proj.techStack && (
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
                            Stack: <span className="text-slate-700 dark:text-slate-300 font-normal">{proj.techStack}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Placement Checklist */}
              {currentRoadmap.interviewChecklist?.length > 0 && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <span>✅</span> Pre-Placement Readiness Checklist
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {currentRoadmap.interviewChecklist.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">➔</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}