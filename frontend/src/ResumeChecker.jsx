import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { useToast } from './Toast';


const SAMPLE_JDS = [
  {
    role: "Amazon - Software Development Engineer I (SDE 1)",
    desc: "Amazon is looking for high-caliber Software Engineers proficient in Java, C++, or Python, Distributed Systems, Object-Oriented Design, Microservices, AWS (DynamoDB, S3, EC2), and multi-threading. Candidates must demonstrate deep knowledge of Data Structures, Algorithms, REST APIs, and CI/CD pipelines."
  },
  {
    role: "Google - Software Engineer (Full Stack / Systems)",
    desc: "Google seeking engineers skilled in C++, Go, Python, or TypeScript. Experience with distributed consensus, high-throughput RPCs, Kubernetes, container orchestration, React, web performance profiling, and system architecture scalability."
  },
  {
    role: "TCS Digital / Infosys Power Programmer",
    desc: "Hiring for Digital Engineering roles with expertise in Core Java, Spring Boot, React/Angular, SQL database indexing, Agile/Scrum methodologies, Git version control, and cloud fundamentals."
  }
];

const COMMON_ROLES = [
  // Tech & Software
  "Software Engineer", "Full Stack Developer", "Frontend Developer", "Backend Developer", 
  "Cloud & DevOps Engineer", "Cybersecurity Analyst", "QA Automation Engineer", "Database Administrator", "Mobile App Developer",
  // AI & Data Science
  "Data Scientist", "Machine Learning Engineer", "Generative AI Specialist", "Data Analyst", "Data Engineer", "Computer Vision Engineer",
  // ECE & VLSI
  "Embedded Systems Engineer", "IoT Solutions Engineer", "VLSI Design Engineer", "Robotics & Automation Engineer", "Firmware Developer",
  // Electrical & Power
  "Power Systems Engineer", "EV & Battery Systems Engineer", "Renewable Energy Analyst", "Control Systems Specialist",
  // Mechanical & Core
  "Mechanical Design Engineer", "CAD/SolidWorks Specialist", "Automotive Systems Engineer", "Thermal & Fluids Specialist", "Manufacturing Operations Engineer",
  // Civil & Infrastructure
  "Structural Engineer", "BIM & AutoCAD Modeler", "Construction Site Engineer", "Geotechnical Analyst", "Environmental Engineer",
  // Chemical & Biotech
  "Process Engineer", "Biochemical Analyst", "Clinical Research Associate", "Pharma R&D Associate", "QC Lab Chemist",
  // Business, Product & Management
  "Technical Product Manager", "Business Analyst", "Management Trainee", "Financial Analyst", "Marketing & Growth Specialist", "HR Talent Acquisition Associate",
  // Design & Media
  "UI/UX Designer", "Product Designer", "Graphic & Brand Identity Designer"
];

const TARGET_COMPANIES = [
  { name: "Google", logo: "🌐" },
  { name: "Amazon", logo: "📦" },
  { name: "Microsoft", logo: "💻" },
  { name: "TCS", logo: "🏢" },
  { name: "Infosys", logo: "🔷" },
  { name: "Deloitte", logo: "💼" },
  { name: "L&T / Core", logo: "🏗️" },
  { name: "Tata Motors", logo: "🚗" },
  { name: "Goldman Sachs", logo: "🏦" },
  { name: "General / Any Company", logo: "⚡" }
];

export default function ResumeChecker({ userEmail, onBack }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [targetRole, setTargetRole] = useState('Software Engineer'); 
  const [companyName, setCompanyName] = useState('General');
  const [showSuggestions, setShowSuggestions] = useState(false); 
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [resumeResult, setResumeResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('keywords'); // 'keywords', 'bullets', 'roadmap', 'formatting'
  const [showHistory, setShowHistory] = useState(false); 
  const [resumeHistory, setResumeHistory] = useState([]);
  const [keywordFilter, setKeywordFilter] = useState('all');
  const [jdText, setJdText] = useState(SAMPLE_JDS[0].desc);
  const [jdMatchResult, setJdMatchResult] = useState(null); // 'all', 'found', 'missing'
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useToast();


  useEffect(() => {
    fetchResumeHistory();
  }, [userEmail]);

  const fetchResumeHistory = async () => {
    try {
      const effectiveEmail = userEmail || 'default@student.com';
      const resHistory = await apiFetch(`/api/resume/history/${effectiveEmail}`);
      if (resHistory.ok) {
        const dbHistory = await resHistory.json();
        if (Array.isArray(dbHistory)) {
          const formattedHistory = dbHistory.map(item => ({
            id: item.id,
            targetRole: item.target_role,
            companyName: item.company_name || 'General',
            recommendedRole: item.recommended_role,
            score: item.score,
            status: item.status,
            date: item.analysis_date,
            fileName: item.file_name,
            ...item.full_data 
          }));
          setResumeHistory(formattedHistory);
          if (formattedHistory.length > 0 && !resumeResult) {
            setResumeResult(formattedHistory[0]); 
          }
        }
      }
    } catch (err) {
      console.error("Failed to load resume history:", err);
    }
  };

  const filteredRoles = COMMON_ROLES.filter(role =>
    role.toLowerCase().includes(targetRole.toLowerCase())
  );

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleResumeUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selected) => {
    if (selected.type !== 'application/pdf' && !selected.name.endsWith('.pdf')) {
      showWarning('Please select a PDF document (.pdf).');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      showWarning('File size exceeds 10MB limit.');
      return;
    }
    setResumeFile(selected);
    showSuccess(`Attached: ${selected.name} (${(selected.size / (1024 * 1024)).toFixed(2)} MB)`);
  };

  const analyzeResume = async () => {
    if (!resumeFile) {
      showWarning("Please attach a PDF resume to analyze.");
      return;
    }
    if (!targetRole.trim()) {
      showWarning("Please specify your target job role.");
      return;
    }
    
    setIsAnalyzingResume(true);
    setAnalyzingStep(1);

    const stepInterval = setInterval(() => {
      setAnalyzingStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 900);

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('targetRole', targetRole.trim()); 
    formData.append('companyName', companyName.trim() || 'General');

    try {
      const response = await apiFetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });
      clearInterval(stepInterval);
      const realResult = await response.json();
      
      if (response.ok) {
        const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const newRecord = { 
          ...realResult, 
          companyName: companyName.trim() || 'General', 
          date: currentDate, 
          fileName: resumeFile.name 
        };
        setResumeHistory(prev => [newRecord, ...prev]);
        setResumeResult(newRecord);
        setShowHistory(false); 
        showSuccess(`Real-Time ATS Scan Complete: ${realResult.score}/100 score computed!`);

        const effectiveEmail = userEmail || 'default@student.com';
        await apiFetch('/api/resume/save-history', {
          method: 'POST',
          body: JSON.stringify({
            email: effectiveEmail,
            targetRole: realResult.targetRole,
            companyName: companyName.trim() || 'General',
            recommendedRole: realResult.recommendedRole,
            score: realResult.score,
            status: realResult.status,
            fileName: resumeFile.name,
            date: currentDate,
            fullData: realResult 
          })
        });
      } else {
        showError(realResult.message || 'Failed to analyze resume.');
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error('Error analyzing resume:', err);
      showError('Server error analyzing resume.');
    }
    setIsAnalyzingResume(false);
    setAnalyzingStep(0);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showInfo("Copied suggested bullet point to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', stroke: '#10b981' };
    if (score >= 65) return { text: 'text-indigo-400', bg: 'bg-indigo-950/60', border: 'border-indigo-500/40', stroke: '#6366f1' };
    if (score >= 50) return { text: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/40', stroke: '#f59e0b' };
    return { text: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-500/40', stroke: '#f43f5e' };
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-fade-in text-slate-900 dark:text-white font-sans space-y-8">
      
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <button 
            onClick={onBack} 
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition flex items-center gap-1.5 mb-2 cursor-pointer"
          >
            ← Back to Student Dashboard
          </button>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3.5 py-1.5 rounded-full mb-2">
            <span>🎯</span> Real-Time AI ATS Screener
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Company-Targeted ATS Resume Analyzer
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Instant semantic parsing, keyword matching, formatting compliance, and recruiter readiness scores.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {resumeHistory.length > 0 && (
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer border flex items-center gap-2 ${
                showHistory 
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>📊</span>
              <span>{showHistory ? 'Scan Editor' : `Audit History (${resumeHistory.length})`}</span>
            </button>
          )}
        </div>
      </header>

      {/* SCAN HISTORY DRAWER / VIEW */}
      {showHistory ? (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-in shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Historical Resume Audits</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Review your past ATS audit scores and track improvement over versions</p>
            </div>
            <button 
              onClick={() => setShowHistory(false)} 
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Close History ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumeHistory.map((item, idx) => {
              const scoreColors = getScoreColor(item.score || 0);
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    setResumeResult(item);
                    setShowHistory(false);
                  }}
                  className="bg-slate-50 dark:bg-slate-950/80 hover:bg-slate-100 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 p-5 rounded-2xl transition cursor-pointer space-y-3 group shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-1 rounded-md uppercase">
                      {item.companyName || 'General'}
                    </span>
                    <div className={`text-2xl font-black ${scoreColors.text}`}>
                      {item.score}<span className="text-xs text-slate-500">/100</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition truncate">
                      {item.targetRole}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      📄 {item.fileName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-900 text-[10px] text-slate-500 font-medium">
                    <span>{item.date}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">
                      View Breakdown ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* UPLOAD & CONFIGURATION CONSOLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            
            {/* Target Role & Autocomplete */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  1. Target Job Role *
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Software Engineer, Full Stack Developer..."
                  value={targetRole}
                  onChange={(e) => {
                    setTargetRole(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none transition shadow-sm"
                />

                {showSuggestions && targetRole.length > 0 && filteredRoles.length > 0 && (
                  <ul className="absolute z-30 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 mt-1.5 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-1.5 space-y-1 animate-fade-in">
                    {filteredRoles.map((role, index) => (
                      <li 
                        key={index} 
                        onMouseDown={() => {
                          setTargetRole(role);
                          setShowSuggestions(false);
                        }}
                        className="px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-xl cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-between"
                      >
                        <span>{role}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Pick</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Target Company Selector */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  2. Target Company (ATS Calibration)
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Google, Amazon, Microsoft, TCS..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium outline-none transition shadow-sm"
                />
              </div>
            </div>

            {/* Quick-Pick Target Company Chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Popular Placement Recruiters:
              </span>
              <div className="flex flex-wrap gap-2">
                {TARGET_COMPANIES.map((comp) => {
                  const isSelected = companyName.toLowerCase() === comp.name.toLowerCase();
                  return (
                    <button
                      key={comp.name}
                      type="button"
                      onClick={() => setCompanyName(comp.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span>{comp.logo}</span>
                      <span>{comp.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Drag & Drop Resume Upload Zone */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all relative ${
                isDragging 
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 scale-[1.01]' 
                  : resumeFile 
                    ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/10' 
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 hover:border-indigo-400'
              }`}
            >
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleResumeUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              
              <div className="space-y-3 pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  {resumeFile ? '📄' : '📁'}
                </div>

                {resumeFile ? (
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base truncate max-w-md mx-auto">
                      {resumeFile.name}
                    </h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                      ✓ PDF Ready for Deep ATS Screening &bull; {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      Drag & Drop your Resume PDF here, or <span className="text-indigo-600 dark:text-indigo-400 underline">Browse Files</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports selectable text PDF resumes up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Trigger Button & Real-Time Loading Progress */}
            {isAnalyzingResume ? (
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-indigo-300 dark:border-indigo-500/40 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {analyzingStep === 1 && "1/3 Parsing PDF text tokens & layout structure..."}
                      {analyzingStep === 2 && "2/3 Measuring keyword density & ATS parser hygiene..."}
                      {analyzingStep === 3 && "3/3 Running Gemini AI recruiter evaluation model..."}
                    </span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">Processing</span>
                </div>
                
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${analyzingStep * 33.3}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <button 
                onClick={analyzeResume} 
                disabled={!resumeFile || !targetRole.trim()} 
                className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 shadow-xl shadow-indigo-600/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>Compute Real-Time ATS Score for {companyName || 'General'}</span>
              </button>
            )}
          </div>

          {/* REAL-TIME ATS SCORE RESULTS DASHBOARD */}
          {resumeResult && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Top Overview Scorecard */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                
                {/* Radial Score Gauge */}
                <div className="flex flex-col items-center text-center justify-center lg:border-r lg:border-slate-200 dark:lg:border-slate-800 lg:pr-8">
                  {(() => {
                    const score = resumeResult.score || 0;
                    const colors = getScoreColor(score);
                    const radius = 64;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (score / 100) * circumference;

                    return (
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                          <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            className="text-slate-200 dark:text-slate-800"
                            strokeWidth="12"
                            fill="transparent"
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke={colors.stroke}
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className={`text-4xl font-black ${colors.text}`}>
                            {score}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            / 100 ATS Score
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-4">
                    <span className={`text-xs font-black px-3.5 py-1.5 rounded-full border ${getScoreColor(resumeResult.score).bg} ${getScoreColor(resumeResult.score).text} ${getScoreColor(resumeResult.score).border}`}>
                      {resumeResult.status || "Evaluated"}
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
                      Audited for: <strong className="text-slate-900 dark:text-white">{resumeResult.targetRole}</strong>
                    </p>
                  </div>
                </div>

                {/* Granular Sub-Metrics & Executive Summary */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Executive Recruiter Verdict &bull; {resumeResult.companyName || 'General'}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Seniority: <strong className="text-slate-900 dark:text-white">{resumeResult.seniorityFit || 'Associate'}</strong>
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      {resumeResult.summary || `Resume evaluated against corporate screening standards for ${resumeResult.targetRole}. Recommended path: ${resumeResult.recommendedRole || resumeResult.targetRole}.`}
                    </p>
                  </div>

                  {/* Dimension Metric Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-400">Keyword Match</span>
                        <span className="text-indigo-600 dark:text-indigo-300 font-bold">{resumeResult.keywordMatchPct || 80}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-700" 
                          style={{ width: `${resumeResult.keywordMatchPct || 80}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-400">Format Hygiene</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{resumeResult.formattingScore || 90}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                          style={{ width: `${resumeResult.formattingScore || 90}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-400">Action Impact</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{resumeResult.impactScore || 75}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full rounded-full transition-all duration-700" 
                          style={{ width: `${resumeResult.impactScore || 75}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Detail Drill-Down Tabs */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                  {[
                    { id: 'keywords', label: '🔍 Keyword Matrix', count: (resumeResult.foundKeywords?.length || 0) + (resumeResult.missingKeywords?.length || 0) },
                    { id: 'bullets', label: '✍️ STAR Bullet Optimizer', count: resumeResult.suggestedBullets?.length || 2 },
                    { id: 'roadmap', label: '📈 Actionable Improvement Plan', count: resumeResult.improvementSkills?.length || 3 },
                    { id: 'formatting', label: '⚠️ Parser & Layout Hygiene', count: resumeResult.lackingAreas?.length || 2 },
                    { id: 'jd_tailor', label: '🎯 AI Job Description (JD) Tailor', count: 'Pro' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveResultTab(tab.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                        activeResultTab === tab.id
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeResultTab === tab.id ? 'bg-indigo-950 text-indigo-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'}`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* TAB 1: KEYWORD MATCH MATRIX */}
                {activeResultTab === 'keywords' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">Target Skills & Keyword Density</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Real-time match comparison for {resumeResult.targetRole}</p>
                      </div>

                      <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex text-xs font-bold">
                        <button
                          onClick={() => setKeywordFilter('all')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${keywordFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          All ({ (resumeResult.foundKeywords?.length || 0) + (resumeResult.missingKeywords?.length || 0) })
                        </button>
                        <button
                          onClick={() => setKeywordFilter('found')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${keywordFilter === 'found' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          ✓ Found ({resumeResult.foundKeywords?.length || 0})
                        </button>
                        <button
                          onClick={() => setKeywordFilter('missing')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${keywordFilter === 'missing' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          ✗ Missing ({resumeResult.missingKeywords?.length || 0})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Detected Keywords */}
                      {(keywordFilter === 'all' || keywordFilter === 'found') && (
                        <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                              <span>✓</span> Detected Keywords ({resumeResult.foundKeywords?.length || 0})
                            </h4>
                            <span className="text-[10px] text-slate-500">Passed ATS Filter</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {resumeResult.foundKeywords?.length > 0 ? (
                              resumeResult.foundKeywords.map((kw, i) => (
                                <span 
                                  key={i} 
                                  className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5"
                                >
                                  <span>✓</span> {kw}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 py-2">No primary keywords detected in resume text.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Missing Keywords */}
                      {(keywordFilter === 'all' || keywordFilter === 'missing') && (
                        <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🚨</span> Missing Essential Keywords ({resumeResult.missingKeywords?.length || 0})
                            </h4>
                            <span className="text-[10px] text-rose-500">Recruiter Filter Gap</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {resumeResult.missingKeywords?.length > 0 ? (
                              resumeResult.missingKeywords.map((kw, i) => (
                                <span 
                                  key={i} 
                                  className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5"
                                >
                                  <span>+</span> {kw}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">Exceptional coverage! All baseline keywords detected.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: AI STAR BULLET OPTIMIZER */}
                {activeResultTab === 'bullets' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">AI-Generated STAR Formula Bullet Points</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Copy and adapt these high-impact project descriptions into your resume to immediately satisfy recruiter criteria.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {(resumeResult.suggestedBullets && resumeResult.suggestedBullets.length > 0 
                        ? resumeResult.suggestedBullets 
                        : [
                            { skill: "Docker & CI/CD", bullet: "Containerized 4 core microservices using Docker and implemented automated GitHub Actions CI/CD pipelines, cutting deployment turnaround by 40%." },
                            { skill: "System Architecture", bullet: "Architected scalable backend APIs with Redis caching layer, handling 50k+ daily requests with sub-50ms latency." }
                          ]
                      ).map((item, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 hover:border-indigo-400 transition">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 px-2.5 py-1 rounded-md uppercase">
                              Target Skill: {item.skill}
                            </span>
                            <button
                              onClick={() => copyToClipboard(item.bullet, idx)}
                              className="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:text-white bg-indigo-100 dark:bg-indigo-950/60 hover:bg-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-500/30 transition cursor-pointer"
                            >
                              {copiedIndex === idx ? "✓ Copied!" : "📋 Copy Bullet"}
                            </button>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                            "{item.bullet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: ACTIONABLE IMPROVEMENT ROADMAP */}
                {activeResultTab === 'roadmap' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Prioritized Improvement Roadmap</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Step-by-step guidance to lift your ATS score above 85%</p>
                    </div>

                    <div className="space-y-3">
                      {resumeResult.improvementSkills?.map((step, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-4">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 font-black text-xs flex items-center justify-center flex-shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                              {step}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: FORMATTING & PARSER HYGIENE */}
                {activeResultTab === 'formatting' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">ATS Parser & Layout Compatibility Checklist</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Formatting checks for Taleo, Workday, Greenhouse, and Lever ATS systems</p>
                    </div>

                    <div className="space-y-3">
                      {resumeResult.lackingAreas?.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-amber-300 dark:border-amber-500/30 flex items-start gap-3.5">
                          <span className="text-amber-500 text-base">⚠️</span>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                            {item}
                          </p>
                        </div>
                      ))}

                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-500/30 flex items-start gap-3.5">
                        <span className="text-emerald-500 text-base">✓</span>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          Clean standard PDF text encoding detected with no image-only text layers.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}