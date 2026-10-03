import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import { useToast } from './Toast';

const SUGGESTED_COMPANIES = [
  { name: "Zomato", role: "Software Development Engineer 1", icon: "🍕", tier: "Startup" },
  { name: "CRED", role: "Backend / Platform Engineer", icon: "💳", tier: "Startup" },
  { name: "Swiggy", role: "Software Engineer 1", icon: "🛵", tier: "Startup" },
  { name: "Zepto", role: "Full Stack Engineer", icon: "🚀", tier: "Startup" },
  { name: "Razorpay", role: "SDE (Payments)", icon: "⚡", tier: "Startup" },
  { name: "Google", role: "Software Engineer (L3)", icon: "🌐", tier: "Big Tech" },
  { name: "Amazon", role: "SDE-1", icon: "📦", tier: "Big Tech" },
  { name: "Microsoft", role: "Software Engineer", icon: "💻", tier: "Big Tech" },
  { name: "TCS", role: "TCS Prime Developer", icon: "🏢", tier: "Enterprise" },
  { name: "Infosys", role: "Specialist Programmer", icon: "⚡", tier: "Enterprise" }
];

const POPULAR_ROLES = [
  "Software Development Engineer (SDE-1)",
  "Full Stack Developer (React / Node)",
  "Backend Engineer (Go / Python / Java)",
  "Frontend Engineer (React / Next.js)",
  "AI & Machine Learning Engineer",
  "Data Scientist / Data Analyst",
  "Cloud & DevOps Engineer (AWS / Docker / K8s)",
  "Cybersecurity & Security Analyst",
  "Embedded & IoT Systems Engineer",
  "Founding Engineer (Early Startup)",
  "TCS Prime / Digital Developer",
  "QA & Automation Test Engineer",
  "UI/UX Product Designer",
  "Technical Product Manager",
  "Other (Type Custom Role Below)"
];

const DEGREES = [
  "B.Tech / B.E. Computer Science & Engineering",
  "B.Tech / B.E. Information Technology",
  "B.Tech / B.E. AI & Data Science",
  "B.Tech / B.E. Electronics & Communication (ECE)",
  "B.Tech / B.E. Electrical Engineering",
  "B.Tech / B.E. Mechanical Engineering",
  "MCA (Master of Computer Applications)",
  "BCA (Bachelor of Computer Applications)",
  "M.Tech / Dual Degree (CS / IT)"
];

export default function CompanyEligibilityChecker({ userEmail, onBack }) {
  const [activeTab, setActiveTab] = useState('checker'); // 'checker' | 'matcher' | 'history'
  const [companyName, setCompanyName] = useState('');
  const [companyScale, setCompanyScale] = useState('auto'); // 'auto' | 'startup' | 'midsize' | 'enterprise'
  const [targetRole, setTargetRole] = useState('Software Development Engineer (SDE-1)');
  const [customRole, setCustomRole] = useState('');
  const [degree, setDegree] = useState(DEGREES[0]);
  const [cgpa, setCgpa] = useState('8.2');
  const [tenth, setTenth] = useState('85');
  const [twelfthOrDiploma, setTwelfthOrDiploma] = useState('80');
  const [activeBacklogs, setActiveBacklogs] = useState('0');
  const [gradYear, setGradYear] = useState('2026');

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { showSuccess, showError, showWarning } = useToast();

  // Matched Companies State
  const [matchedData, setMatchedData] = useState(null);
  const [loadingMatched, setLoadingMatched] = useState(false);

  // History States
  const [eligibilityHistory, setEligibilityHistory] = useState([]);

  useEffect(() => {
    if (userEmail && userEmail !== 'default@student.com') {
      fetchEligibilityHistory();
    }
  }, [userEmail]);

  const fetchEligibilityHistory = async () => {
    try {
      const effectiveEmail = userEmail || 'default@student.com';
      const response = await apiFetch(`/api/company/history/${effectiveEmail}`);
      if (response.ok) {
        const data = await response.json();
        setEligibilityHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch eligibility history:", err);
    }
  };

  const fetchMatchedCompanies = async () => {
    const numCgpa = parseFloat(cgpa);
    if (!cgpa.trim() || isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      setFieldErrors(prev => ({ ...prev, cgpa: "Valid CGPA (0.0 to 10.0) is required." }));
      showWarning("Please enter a valid CGPA between 0.0 and 10.0 before running auto-match.");
      return;
    }

    setLoadingMatched(true);
    try {
      const response = await apiFetch('/api/company/matched-companies', {
        method: 'POST',
        body: JSON.stringify({
          cgpa: cgpa.trim(),
          degree,
          tenth: tenth.trim(),
          twelfthOrDiploma: twelfthOrDiploma.trim(),
          activeBacklogs,
          gradYear
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMatchedData(data);
        showSuccess(`Found ${data.totalEligibleCount || 15}+ companies you qualify for!`);
      } else {
        showError("Failed to calculate matched companies.");
      }
    } catch (err) {
      console.error("Error fetching matched companies:", err);
      showError("Server error finding eligible companies.");
    }
    setLoadingMatched(false);
  };

  const handlePickSuggestion = (item) => {
    setCompanyName(item.name);
    if (POPULAR_ROLES.includes(item.role)) {
      setTargetRole(item.role);
      setCustomRole('');
    } else {
      setTargetRole("Other (Type Custom Role Below)");
      setCustomRole(item.role);
    }
    setFieldErrors(prev => ({ ...prev, companyName: null, customRole: null }));
    if (item.tier === 'Startup') setCompanyScale('startup');
    else if (item.tier === 'Big Tech' || item.tier === 'Enterprise') setCompanyScale('enterprise');
    else setCompanyScale('auto');
  };

  const handleInspectCompany = (comp) => {
    setCompanyName(comp.name);
    const roleName = comp.role || 'Software Engineer';
    if (POPULAR_ROLES.includes(roleName)) {
      setTargetRole(roleName);
      setCustomRole('');
    } else {
      setTargetRole("Other (Type Custom Role Below)");
      setCustomRole(roleName);
    }
    setFieldErrors({});
    setActiveTab('checker');
  };

  const handleCheckEligibility = async (e) => {
    if (e) e.preventDefault();
    const finalCompany = companyName.trim();
    const isOtherSelected = targetRole.includes('Other');
    const finalRole = (customRole.trim() || (isOtherSelected ? '' : targetRole)).trim();

    const errs = {};
    if (!finalCompany) {
      errs.companyName = "Company Name is required to evaluate eligibility.";
    }
    if (isOtherSelected && !customRole.trim()) {
      errs.customRole = "Please enter your custom job role title.";
    } else if (!finalRole) {
      errs.customRole = "Job role title is required.";
    }
    const cgpaNum = parseFloat(cgpa);
    if (!cgpa.trim() || isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      errs.cgpa = "Enter a valid CGPA between 0.0 and 10.0.";
    }
    const tenthNum = parseFloat(tenth);
    if (!tenth.trim() || isNaN(tenthNum) || tenthNum < 0 || tenthNum > 100) {
      errs.tenth = "Enter a valid 10th grade % (0 to 100).";
    }
    const twNum = parseFloat(twelfthOrDiploma);
    if (!twelfthOrDiploma.trim() || isNaN(twNum) || twNum < 0 || twNum > 100) {
      errs.twelfthOrDiploma = "Enter a valid 12th/Diploma % (0 to 100).";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showWarning("Please complete all required fields before evaluating.");
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setResult(null);

    try {
      const response = await apiFetch('/api/company/eligibility', {
        method: 'POST',
        body: JSON.stringify({
          tenth: tenth.trim(),
          twelfthOrDiploma: twelfthOrDiploma.trim(),
          degree,
          cgpa: cgpa.trim(),
          companyName: finalCompany,
          targetRole: finalRole,
          activeBacklogs: activeBacklogs,
          gradYear: gradYear,
          companyScale: companyScale
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
        setActiveTab('checker');
        showSuccess(`Evaluated eligibility for ${data.companyName} • ${data.targetRole}!`);

        const effectiveEmail = userEmail || 'default@student.com';
        await apiFetch('/api/company/save-history', {
          method: 'POST',
          body: JSON.stringify({
            email: effectiveEmail,
            companyName: data.companyName,
            targetRole: data.targetRole,
            isEligible: data.isEligible,
            matchStatus: data.matchStatus,
            fullData: data
          })
        });

        fetchEligibilityHistory();
      } else {
        showError(data.message || "Failed to evaluate eligibility.");
      }
    } catch (err) {
      console.error("Eligibility check error:", err);
      showError("Server error connecting to backend.");
    }
    setLoading(false);
  };

  const getMatchScoreBadge = (score = 0) => {
    if (score >= 85) return { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/80', border: 'border-emerald-300 dark:border-emerald-500/40', label: '🔥 Prime Match' };
    if (score >= 70) return { color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/80', border: 'border-indigo-300 dark:border-indigo-500/40', label: '✓ High Fit' };
    if (score >= 50) return { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/80', border: 'border-amber-300 dark:border-amber-500/40', label: '⚠️ Moderate Fit' };
    return { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/80', border: 'border-rose-300 dark:border-rose-500/40', label: '❌ Benchmark Gap' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16 text-slate-900 dark:text-white font-sans">
      
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
            <span>🏢</span> Real-Time Placement Eligibility & Recruiter Matcher
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Placement Eligibility & Recruiter Discovery
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Evaluate custom companies or auto-discover every top recruiter you qualify for based on your CGPA.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('checker')}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'checker' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🎯</span>
            <span>Check Any Company</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('matcher');
              if (!matchedData) fetchMatchedCompanies();
            }}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'matcher' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🔍</span>
            <span>Eligible Radar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              fetchEligibilityHistory();
            }}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📜</span>
            <span>History ({eligibilityHistory.length})</span>
          </button>
        </div>
      </header>

      {/* TAB 1: AUTO-MATCHED ELIGIBLE COMPANIES RADAR */}
      {activeTab === 'matcher' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 mb-1 inline-block">
                  Live Qualification Radar
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Companies You Are 100% Eligible For</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Calculated based on your <strong className="text-slate-900 dark:text-white">{cgpa} CGPA</strong>, <strong className="text-slate-900 dark:text-white">{activeBacklogs} backlogs</strong>, and <strong className="text-slate-900 dark:text-white">{degree}</strong>.
                </p>
              </div>

              <button
                onClick={fetchMatchedCompanies}
                disabled={loadingMatched}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                {loadingMatched ? 'Recalculating...' : '🔄 Refresh Matches'}
              </button>
            </div>

            {loadingMatched ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-8 h-8 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Scanning corporate benchmarks and cutoff criteria for {degree}...</p>
              </div>
            ) : matchedData ? (
              <div className="space-y-6">
                
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{matchedData.matchTierSummary || `You qualify for ${matchedData.totalEligibleCount || 15} companies!`}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">Click on any company below to run an in-depth role audit & view hiring pipeline.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-300 dark:border-emerald-500/30">
                    {matchedData.totalEligibleCount || 15} Qualified ✓
                  </span>
                </div>

                {matchedData.categories.map((cat, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span>{cat.categoryName}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({cat.companies.length} Companies)</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cat.companies.map((c, i) => (
                        <div
                          key={i}
                          onClick={() => handleInspectCompany(c)}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/60 p-4 rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">{c.icon || '🏢'}</span>
                              <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">{c.name}</h4>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">{c.role}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
                              {c.hiringPill || 'Eligible'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Package</span>
                              <strong className="text-emerald-700 dark:text-emerald-400">{c.package}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 block text-[10px]">Cutoff Benchmark</span>
                              <strong className="text-slate-700 dark:text-slate-300">{c.cutoff}</strong>
                            </div>
                          </div>

                          <div className="pt-1 flex items-center justify-between text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                            <span>Match Index: {c.matchScore || 95}%</span>
                            <span className="group-hover:translate-x-1 transition">Audit Role ➔</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              </div>
            ) : null}

          </div>

        </div>
      )}

      {/* TAB 2: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Past Evaluation Reports</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Click any report to view detailed hiring benchmarks.</p>
            </div>
            <button 
              onClick={() => setActiveTab('checker')} 
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              ← Back to Evaluator
            </button>
          </div>

          {eligibilityHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              <span className="text-3xl block mb-2">📂</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white">No evaluation reports saved yet.</p>
              <p className="text-xs mt-1">Enter any company and role above to check your placement eligibility.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {eligibilityHistory.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setResult(item); setActiveTab('checker'); }}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 transition cursor-pointer flex flex-col justify-between space-y-2.5 shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{item.companyName}</span>
                        <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">
                          {item.targetRole || 'Software Engineer'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Checked on: {item.date}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                      item.isEligible ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                    }`}>
                      {item.isEligible ? 'Eligible ✅' : 'Cutoff Gap ⚠️'}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                    <span>Est. Package: <strong className="text-slate-900 dark:text-white">{item.expectedPackage || '₹6 - ₹12 LPA'}</strong></span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">View ➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOM COMPANY EVALUATOR */}
      {activeTab === 'checker' && (
        <div className="space-y-6">
          
          {/* Main Form Box */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            
            {/* Quick 1-Click Suggestions Pill Strip */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                <span>Quick Autofill Suggestions (Optional):</span>
                <span className="text-[10px] text-slate-500 font-normal">or type ANY custom company below</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {SUGGESTED_COMPANIES.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => handlePickSuggestion(s)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCheckEligibility} className="space-y-4 pt-1">
              
              {/* Row 1: Company Name + Scale */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>🏢</span> Target Company Name <span className="text-rose-500">*</span>
                    </span>
                    {fieldErrors.companyName && (
                      <span className="text-[10px] text-rose-500 font-bold lowercase">⚠️ {fieldErrors.companyName}</span>
                    )}
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Hasura, Motadata, CRED, Urban Company, or your target startup..."
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (fieldErrors.companyName) setFieldErrors(prev => ({ ...prev, companyName: null }));
                    }}
                    required
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-2xl font-bold text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition ${
                      fieldErrors.companyName 
                        ? 'border-rose-500 ring-2 ring-rose-500/20' 
                        : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                    <span>📏</span> Company Scale / Stage
                  </label>
                  <select
                    value={companyScale}
                    onChange={(e) => setCompanyScale(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="auto">✨ Auto-Detect with AI</option>
                    <option value="startup">🚀 Early / Seed Startup (&lt;50)</option>
                    <option value="midsize">📈 Mid-Market Product (50-500)</option>
                    <option value="enterprise">🌐 Large Tech / Enterprise (500+)</option>
                  </select>
                </div>

              </div>

              {/* Row 2: Target Role & Other Custom Role Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                    <span>💼</span> Select Job Role
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => {
                      setTargetRole(e.target.value);
                      if (e.target.value.includes('Other')) {
                        setCustomRole('');
                      }
                      if (fieldErrors.customRole) setFieldErrors(prev => ({ ...prev, customRole: null }));
                    }}
                    className={`w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border rounded-2xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer transition ${
                      targetRole.includes('Other') 
                        ? 'border-indigo-500 ring-1 ring-indigo-500/30' 
                        : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500'
                    }`}
                  >
                    {POPULAR_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>✍️</span> Custom Role Title {targetRole.includes('Other') && <span className="text-rose-500">*</span>}
                    </span>
                    {fieldErrors.customRole && (
                      <span className="text-[10px] text-rose-500 font-bold lowercase">⚠️ {fieldErrors.customRole}</span>
                    )}
                  </label>
                  <input 
                    type="text"
                    placeholder={targetRole.includes('Other') ? "Type your exact job role title here..." : "e.g. Lead SRE, Founding Rust Developer (Optional)..."}
                    value={customRole}
                    onChange={(e) => {
                      setCustomRole(e.target.value);
                      if (fieldErrors.customRole) setFieldErrors(prev => ({ ...prev, customRole: null }));
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-2xl font-medium text-slate-900 dark:text-white text-xs outline-none transition ${
                      fieldErrors.customRole
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : targetRole.includes('Other')
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 focus:border-indigo-400'
                          : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* Row 3: Academic Profile (CGPA, Backlogs, 10th %, 12th %) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 flex items-center justify-between">
                    <span>Current CGPA <span className="text-rose-500">*</span></span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 8.2"
                    value={cgpa}
                    onChange={(e) => {
                      setCgpa(e.target.value);
                      if (fieldErrors.cgpa) setFieldErrors(prev => ({ ...prev, cgpa: null }));
                    }}
                    required
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl font-bold text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition ${
                      fieldErrors.cgpa 
                        ? 'border-rose-500 ring-2 ring-rose-500/20' 
                        : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {fieldErrors.cgpa && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1">⚠️ {fieldErrors.cgpa}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Active Backlogs</label>
                  <select 
                    value={activeBacklogs}
                    onChange={(e) => setActiveBacklogs(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="0">0 (Clean Record)</option>
                    <option value="1">1 Backlog</option>
                    <option value="2">2+ Backlogs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 flex items-center justify-between">
                    <span>10th Std (%) <span className="text-rose-500">*</span></span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 85"
                    value={tenth}
                    onChange={(e) => {
                      setTenth(e.target.value);
                      if (fieldErrors.tenth) setFieldErrors(prev => ({ ...prev, tenth: null }));
                    }}
                    required
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl font-medium text-xs text-slate-900 dark:text-white outline-none transition ${
                      fieldErrors.tenth 
                        ? 'border-rose-500 ring-2 ring-rose-500/20' 
                        : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {fieldErrors.tenth && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1">⚠️ {fieldErrors.tenth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1 flex items-center justify-between">
                    <span>12th / Diploma (%) <span className="text-rose-500">*</span></span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 80"
                    value={twelfthOrDiploma}
                    onChange={(e) => {
                      setTwelfthOrDiploma(e.target.value);
                      if (fieldErrors.twelfthOrDiploma) setFieldErrors(prev => ({ ...prev, twelfthOrDiploma: null }));
                    }}
                    required
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl font-medium text-xs text-slate-900 dark:text-white outline-none transition ${
                      fieldErrors.twelfthOrDiploma 
                        ? 'border-rose-500 ring-2 ring-rose-500/20' 
                        : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {fieldErrors.twelfthOrDiploma && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1">⚠️ {fieldErrors.twelfthOrDiploma}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Degree + Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Degree / Branch</label>
                  <select 
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    {DEGREES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Graduation Batch</label>
                  <select 
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="2025">2025 Batch</option>
                    <option value="2026">2026 Batch (Current)</option>
                    <option value="2027">2027 Batch</option>
                    <option value="2028">2028 Batch</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition cursor-pointer text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Evaluating {companyName || 'Company'} Eligibility with AI...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Evaluate Placement Eligibility Now →</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Results Scorecard Section */}
          {result && (
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl animate-fade-in">
              
              {/* Header Ribbon */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 mb-1">
                    <span>📊</span> Placement Audit Report
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>{result.companyName}</span>
                    <span className="text-slate-400 font-normal">&bull;</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{result.targetRole || customRole || targetRole}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2.5">
                  {(() => {
                    const badge = getMatchScoreBadge(result.matchPercentage || 85);
                    return (
                      <div className={`px-3 py-1.5 rounded-xl font-black text-xs border flex items-center gap-1.5 ${badge.bg} ${badge.color} ${badge.border}`}>
                        <span>{badge.label}</span>
                        <span>({result.matchPercentage || 85}%)</span>
                      </div>
                    );
                  })()}
                  <div className={`px-3 py-1.5 rounded-xl font-black text-xs border ${
                    result.isEligible ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40' : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/40'
                  }`}>
                    {result.isEligible ? '✅ Shortlist Eligible' : '⚠️ Cutoff Gap'}
                  </div>
                </div>
              </div>

              {/* Match Metric + Expected CTC Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-500/40 flex items-center justify-center text-lg font-black text-indigo-700 dark:text-indigo-300 shrink-0">
                    {result.matchPercentage || 85}%
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Match Status</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">{result.matchStatus || 'Eligible & Qualified'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-center text-lg font-black text-emerald-700 dark:text-emerald-300 shrink-0">
                    💰
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Estimated CTC</p>
                    <p className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{result.expectedPackage || '₹8 LPA - ₹15 LPA CTC'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-500/40 flex items-center justify-center text-lg font-black text-purple-700 dark:text-purple-300 shrink-0">
                    🎓
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Stream Fit</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate max-w-[150px]">{degree}</p>
                  </div>
                </div>

              </div>

              {/* Criteria Benchmarks Strip */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span>📐</span> Real-Time Eligibility Benchmarks for {result.targetRole || 'this Role'}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">CGPA Benchmark</p>
                    <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm mt-1">{result.criteriaSummary?.requiredCgpa || '6.5 CGPA'}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Your CGPA: {cgpa}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Backlog Rule</p>
                    <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm mt-1">{result.criteriaSummary?.backlogPolicy || '0 Active Allowed'}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Your Backlogs: {activeBacklogs}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">10th Std Cutoff</p>
                    <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm mt-1">{result.criteriaSummary?.required10th || '60%'}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Your Score: {tenth}%</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">12th / Diploma</p>
                    <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm mt-1">{result.criteriaSummary?.required12th || '60%'}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Your Score: {twelfthOrDiploma}%</p>
                  </div>
                </div>
              </div>

              {/* Selection Process Roadmap & Mandatory Skills */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Selection Process */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>🗺️</span> {result.companyName} Hiring Process Rounds
                  </h3>

                  <div className="space-y-2.5">
                    {(result.selectionRounds || [
                      "Round 1: Practical Machine Coding / Take-Home Project Assessment",
                      "Round 2: Technical Domain Interview & Live Code Walkthrough",
                      "Round 3: Problem Solving & Core Fundamentals",
                      "Round 4: Founder / HR Cultural Fit Discussion"
                    ]).map((round, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                        <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-bold mt-0.5">{round}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mandatory Skills Matrix */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                      <span>⚡</span> Key Skill Stack Evaluated for {result.targetRole || 'Role'}
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Core technologies and practical capabilities required:</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(result.mandatorySkillStack || [
                        "Data Structures & Problem Solving",
                        "React / Node / Python",
                        "Database Architecture & SQL",
                        "Git & API Development"
                      ]).map((skill, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/40 text-purple-800 dark:text-purple-300 text-xs font-bold"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5 mt-2">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Recruiter Analysis</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{result.reasoning}</p>
                  </div>
                </div>

              </div>

              {/* Actionable Next Steps */}
              {result.improvementTips?.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span>🎯</span> Action Plan to Crack {result.companyName}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.improvementTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm shrink-0">➔</span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{tip}</p>
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