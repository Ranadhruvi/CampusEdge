import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from './api';
import { useToast } from './Toast';

export default function PlacementDrivesHub({ userEmail, userName, userRole, userAddress, userHometown, onBack }) {
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'high_ctc' | 'local' | 'closing_soon'

  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  // Admin Form States
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [role, setRole] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [internshipDetails, setInternshipDetails] = useState('');
  const [selectionProcess, setSelectionProcess] = useState('');
  const [fullTimeOffer, setFullTimeOffer] = useState('');
  const [packageVal, setPackageVal] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [deadlineText, setDeadlineText] = useState('');
  const [deadlineTimestamp, setDeadlineTimestamp] = useState('');
  const [noticeType, setNoticeType] = useState('Job Drive');
  const [pdfUrl, setPdfUrl] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // Admin View Applicants State
  const [viewingApplicantsFor, setViewingApplicantsFor] = useState(null);
  const [applicantStats, setApplicantStats] = useState({ totalRegisteredStudents: 0, totalAppliedCount: 0, applicants: [] });
  const [showExpiredArchives, setShowExpiredArchives] = useState(false);

  useEffect(() => {
    fetchDrives();
  }, [showExpiredArchives]);

  const fetchDrives = async () => {
    try {
      const url = `/api/drives/all${showExpiredArchives ? '?includeExpired=true' : ''}`;
      const res = await apiFetch(url);
      if (res.ok) setDrives(await res.json());
    } catch (err) {
      console.error("Error fetching drives:", err);
    }
  };

  // Robust multi-format deadline parser supporting ISO, DD/MM/YYYY, DD-MM-YYYY, Month DD YYYY, etc.
  const parseDeadlineDate = (text, timestamp) => {
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) return d;
    }
    if (!text || typeof text !== 'string') return null;

    const trimmed = text.trim();

    // 1. Direct standard parse
    const direct = Date.parse(trimmed);
    if (!isNaN(direct)) {
      const d = new Date(direct);
      return d;
    }

    // 2. Handle DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmyMatch = trimmed.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      let hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 23;
      const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 59;
      const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 59;
      const meridian = dmyMatch[7] ? dmyMatch[7].toLowerCase() : null;

      if (meridian === 'pm' && hours < 12) hours += 12;
      if (meridian === 'am' && hours === 12) hours = 0;

      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }

    // 3. Handle "DD Month YYYY" e.g. "25 Oct 2026" or "25th October 2026 5:00 PM"
    const textCleaned = trimmed.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
    const monthMatch = textCleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (monthMatch) {
      const parsedMonth = Date.parse(`${monthMatch[2]} ${monthMatch[1]}, ${monthMatch[3]}`);
      if (!isNaN(parsedMonth)) {
        const d = new Date(parsedMonth);
        d.setHours(23, 59, 59, 999);
        return d;
      }
    }

    return null;
  };

  const isDriveActive = (drive) => {
    if (drive.isExpired) return false;
    const deadlineDate = parseDeadlineDate(drive.deadline_text, drive.deadline_timestamp);
    if (deadlineDate) {
      return deadlineDate >= new Date();
    }
    return true;
  };

  const checkIsLocal = (drive) => {
    if (!drive.is_local_only || !drive.job_location) return true;
    
    const targetLoc = drive.job_location.trim().toLowerCase();
    const studentAddress = (userAddress || '').trim().toLowerCase();
    const studentHometown = (userHometown || '').trim().toLowerCase();

    return (
      (studentAddress && studentAddress.includes(targetLoc)) || 
      (studentHometown && studentHometown.includes(targetLoc)) ||
      (studentHometown && targetLoc.includes(studentHometown))
    );
  };

  // Filtered Drives
  const filteredDrives = useMemo(() => {
    let list = showExpiredArchives ? drives : drives.filter(isDriveActive);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => 
        (d.company_name || '').toLowerCase().includes(q) ||
        (d.role || '').toLowerCase().includes(q) ||
        (d.job_location || '').toLowerCase().includes(q) ||
        (d.package || '').toLowerCase().includes(q)
      );
    }

    if (filterType === 'local') {
      list = list.filter(d => d.is_local_only);
    } else if (filterType === 'high_ctc') {
      list = list.filter(d => {
        const num = parseFloat((d.package || '').replace(/[^0-9.]/g, ''));
        return !isNaN(num) && num >= 8;
      });
    }

    return list;
  }, [drives, showExpiredArchives, searchQuery, filterType]);

  // Statistics
  const activeCount = drives.filter(isDriveActive).length;
  const localCount = drives.filter(d => isDriveActive(d) && d.is_local_only).length;

  const handlePostDrive = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showWarning("Company Name is required.");
      return;
    }
    if (!role.trim()) {
      showWarning("Job Role / Designation is required.");
      return;
    }
    if (!packageVal.trim()) {
      showWarning("Expected CTC Package is required.");
      return;
    }
    if (!eligibility.trim()) {
      showWarning("Eligibility Criteria (CGPA/Stream) is required.");
      return;
    }
    if (!applyLink.trim()) {
      showWarning("Official Application Link is required.");
      return;
    }

    try {
      const res = await apiFetch('/api/admin/drives/create', {
        method: 'POST',
        body: JSON.stringify({
          companyName: companyName.trim(), 
          website: website.trim(), 
          role: role.trim(), 
          eligibility: eligibility.trim(), 
          internshipDetails: internshipDetails.trim(),
          selectionProcess: selectionProcess.trim(), 
          fullTimeOffer: fullTimeOffer.trim(), 
          packageVal: packageVal.trim(), 
          applyLink: applyLink.trim(), 
          instructions: instructions.trim(),
          deadlineText: deadlineText.trim(), 
          deadlineTimestamp, 
          noticeType, 
          pdfUrl: pdfUrl.trim(), 
          jobLocation: jobLocation.trim(), 
          isLocalOnly
        })
      });
      if (res.ok) {
        setShowPostModal(false);
        setCompanyName(''); setWebsite(''); setRole(''); setEligibility('');
        setInternshipDetails(''); setSelectionProcess(''); setFullTimeOffer('');
        setPackageVal(''); setApplyLink(''); setInstructions(''); setDeadlineText('');
        setDeadlineTimestamp(''); setNoticeType('Job Drive'); setPdfUrl('');
        setJobLocation(''); setIsLocalOnly(false);
        fetchDrives();
        showSuccess("Notice published and email broadcast dispatched!");
      } else {
        const data = await res.json();
        showError(data.message || "Failed to publish notice.");
      }
    } catch (err) {
      console.error("Error posting notice:", err);
      showError("Server error posting notice.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleStudentApply = async (e) => {
    e.preventDefault();
    if (!additionalInfo.trim()) {
      showWarning("Please provide registration confirmation notes or Candidate ID.");
      return;
    }
    if (!screenshotFile) {
      showWarning("Please upload your registration confirmation screenshot.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('driveId', selectedDrive.id);
      formData.append('email', userEmail);
      formData.append('studentName', userName);
      formData.append('additionalInfo', additionalInfo.trim());
      formData.append('screenshotFile', screenshotFile);

      const res = await apiFetch('/api/student/drives/apply', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("Successfully registered and confirmation uploaded!");
        setSelectedDrive(null);
        setAdditionalInfo('');
        setScreenshotFile(null);
        setScreenshotPreview(null);
        fetchDrives();
      } else {
        showError(data.message || "Failed to register.");
      }
    } catch (err) {
      console.error("Error applying:", err);
      showError("Server error submitting application.");
    }
  };

  const fetchApplicants = async (driveId) => {
    setViewingApplicantsFor(driveId);
    try {
      const res = await apiFetch(`/api/admin/drives/${driveId}/applicants`);
      if (res.ok) {
        setApplicantStats(await res.json());
      }
    } catch (err) {
      console.error("Error fetching applicants:", err);
    }
  };

  const handleDeleteDrive = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      const res = await apiFetch(`/api/admin/drives/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess("Notice deleted successfully.");
        fetchDrives();
      }
    } catch (err) {
      console.error("Error deleting notice:", err);
      showError("Failed to delete notice.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showInfo("Application link copied to clipboard!");
  };

  const isAdmin = userRole === 'admin';
  const displayLocation = userAddress || userHometown || 'Not Provided';

  return (
    <div className="max-w-5xl mx-auto space-y-7 animate-fade-in pb-16 font-sans text-slate-900 dark:text-white">
      
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
            <span>📢</span> Official University Placement Board
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Placement Circulars & Company Drives
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            {isAdmin 
              ? "Publish placement circulars with AI auto-fill, set location criteria, and manage student proofs." 
              : "Review live recruitment notices, check CGPA cutoffs, and upload your registration confirmation proof."}
          </p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setShowPostModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <span>📋</span>
            <span>+ Publish Placement Circular</span>
          </button>
        )}
      </header>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
            🏢
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Active Circulars</span>
            <span className="text-lg sm:text-xl font-black text-indigo-700 dark:text-indigo-400">{activeCount} <span className="text-xs text-indigo-600/70 font-normal">open</span></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
            💰
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Max CTC Package</span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400">₹24.0 <span className="text-xs text-emerald-600/70 font-normal">LPA</span></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-xl shrink-0">
            📍
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Location Restricted</span>
            <span className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400">{localCount} <span className="text-xs text-amber-600/70 font-normal">drives</span></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-xl shrink-0">
            ⚡
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Recruitment Drives</span>
            <span className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-400">2026 <span className="text-xs text-purple-600/70 font-normal">Batch</span></span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input 
              type="text" 
              placeholder="Search by company, role, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl font-medium text-slate-900 dark:text-white text-xs outline-none shadow-xs"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterType === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              All Circulars ({filteredDrives.length})
            </button>
            <button
              onClick={() => setFilterType('high_ctc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterType === 'high_ctc' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              💰 High CTC (≥8 LPA)
            </button>
            <button
              onClick={() => setFilterType('local')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterType === 'local' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              📍 Local Match Only
            </button>
          </div>

        </div>

        {isAdmin && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showExpiredArchives} 
                onChange={(e) => setShowExpiredArchives(e.target.checked)}
                className="accent-indigo-600 rounded cursor-pointer"
              />
              <span>Show Past / Expired Archives ({drives.length})</span>
            </label>
          </div>
        )}
      </div>

      {/* Notices Feed */}
      <div className="space-y-6">
        {filteredDrives.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs space-y-2">
            <span className="text-3xl block mb-1">📭</span>
            <p className="font-bold text-sm text-slate-900 dark:text-white">No placement circulars found.</p>
            <p>Try searching for a different company or reset your filter settings.</p>
          </div>
        ) : (
          filteredDrives.map((drive) => {
            const isLocalEligible = checkIsLocal(drive);
            const isExpired = !isDriveActive(drive);

            return (
              <div 
                key={drive.id} 
                className={`bg-white dark:bg-slate-900/90 rounded-3xl shadow-xl border transition p-6 sm:p-8 space-y-6 relative overflow-hidden ${
                  isExpired 
                    ? 'border-rose-300 dark:border-rose-500/30 bg-rose-50/30 dark:bg-slate-950/70' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-indigo-500/5'
                }`}
              >
                
                {/* Status Indicator Ribbon */}
                {isExpired && (
                  <div className="absolute top-5 right-5 bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 font-black text-[10px] px-3 py-1 rounded-xl border border-rose-300 dark:border-rose-500/40 uppercase tracking-wider shadow">
                    Closed / Expired ✕
                  </div>
                )}

                {/* Card Header: Brand, Title, Category, Package */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5 pr-20 md:pr-0">
                  <div className="flex items-start gap-4">
                    
                    {/* Brand Avatar */}
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-800 p-0.5 shadow-lg shrink-0">
                      <div className="w-full h-full bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center font-black text-slate-900 dark:text-white text-base">
                        {drive.company_name ? drive.company_name.charAt(0).toUpperCase() : '🏢'}
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                          {drive.notice_type || 'Job Drive'}
                        </span>
                        {drive.is_local_only && (
                          <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/30 px-2.5 py-0.5 rounded-md">
                            📍 Local Only ({drive.job_location || 'Specific City'})
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Batch: 2026
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {drive.company_name} <span className="text-slate-400 font-normal">•</span> <span className="text-indigo-600 dark:text-indigo-300">{drive.role}</span>
                      </h2>

                      {drive.job_location && (
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>📍 Location:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold">{drive.job_location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTC Package Badge */}
                  {drive.package && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 px-4 py-2 rounded-2xl text-right shrink-0 shadow-sm">
                      <span className="text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-400/80 tracking-wider block">Expected CTC</span>
                      <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300">{drive.package}</span>
                    </div>
                  )}
                </div>

                {/* Criteria Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {drive.eligibility && (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 p-4 sm:p-5 rounded-2xl space-y-2 shadow-xs">
                      <h4 className="font-black uppercase tracking-wider text-[11px] text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                        <span>📌</span> Eligibility & Cutoff:
                      </h4>
                      <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {drive.eligibility}
                      </div>
                    </div>
                  )}

                  {drive.internship_details && (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 p-4 sm:p-5 rounded-2xl space-y-2 shadow-xs">
                      <h4 className="font-black uppercase tracking-wider text-[11px] text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                        <span>🕒</span> Terms & Internship Details:
                      </h4>
                      <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {drive.internship_details}
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Links & PDF Bar */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs">
                  
                  {isAdmin || !drive.is_local_only || isLocalEligible ? (
                    drive.apply_link && (
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-0.5">🔗 Official Registration Portal:</span>
                          <a 
                            href={drive.apply_link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                          >
                            {drive.apply_link}
                          </a>
                        </div>
                        <button
                          onClick={() => copyToClipboard(drive.apply_link)}
                          className="px-3 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition cursor-pointer shrink-0 shadow-xs"
                        >
                          📋 Copy Link
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-4 rounded-2xl text-xs text-rose-800 dark:text-rose-300 font-semibold space-y-1">
                      <p>🔒 <b>Location Restricted:</b> This recruitment notice is restricted to students residing in <b>{drive.job_location}</b>.</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Your profile location ({displayLocation}) does not meet the specified local residency requirement.</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap justify-between items-center gap-3">
                    {drive.deadline_text ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-amber-700 dark:text-amber-400 font-bold">⏰ Deadline:</span>
                        <span className={`font-bold ${isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {drive.deadline_text}
                        </span>
                      </div>
                    ) : <div></div>}

                    {drive.pdf_url && (
                      <a 
                        href={drive.pdf_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs px-3.5 py-1.5 rounded-xl transition inline-flex items-center gap-1.5"
                      >
                        <span>📄</span> Download Circular PDF
                      </a>
                    )}
                  </div>

                </div>

                {/* Card Action Controls */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {isAdmin ? (
                    <>
                      <button 
                        onClick={() => fetchApplicants(drive.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition flex items-center gap-1.5"
                      >
                        <span>📊</span> View Applicants & Proofs
                      </button>
                      <button 
                        onClick={() => handleDeleteDrive(drive.id)}
                        className="bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer transition"
                      >
                        Delete Notice
                      </button>
                    </>
                  ) : drive.apply_link ? (
                    <button 
                      onClick={() => {
                        if (!userAddress && !userHometown) {
                          showWarning("Please complete your location/address in your profile before applying.");
                          return;
                        }
                        setSelectedDrive(drive);
                      }}
                      disabled={isExpired || !isLocalEligible}
                      className={`text-xs font-black px-6 py-3 rounded-xl shadow-lg transition flex items-center gap-2 ${
                        isExpired || !isLocalEligible
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700' 
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-indigo-600/30 cursor-pointer'
                      }`}
                    >
                      {isExpired 
                        ? '❌ Registrations Closed' 
                        : !isLocalEligible 
                          ? '🔒 Location Restricted' 
                          : '🚀 Confirm Registration & Upload Proof →'}
                    </button>
                  ) : null}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Student Application Confirmation Modal */}
      {selectedDrive && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 sm:p-8 animate-fade-in space-y-5 text-slate-900 dark:text-white">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                  {selectedDrive.company_name}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Upload Registration Confirmation Proof</h3>
              </div>
              <button onClick={() => setSelectedDrive(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleStudentApply} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Candidate Profile</label>
                <input 
                  type="text" 
                  disabled 
                  value={`${userName} (${displayLocation})`} 
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-medium" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Candidate ID / Registration Confirmation Notes <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  rows="2" 
                  value={additionalInfo} 
                  onChange={(e) => setAdditionalInfo(e.target.value)} 
                  required 
                  placeholder="e.g. Registered via Google Form. Candidate ID: TCS-2026-9812..." 
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl font-medium outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Upload Registration Form Screenshot / Proof <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  required 
                  className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-100 dark:file:bg-indigo-600/20 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-200 dark:hover:file:bg-indigo-600/30 cursor-pointer border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950" 
                />

                {screenshotPreview && (
                  <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">Selected Proof Preview:</span>
                    <img src={screenshotPreview} alt="Proof Preview" className="max-h-36 rounded-lg object-contain mx-auto" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedDrive(null);
                    setScreenshotPreview(null);
                  }} 
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md cursor-pointer"
                >
                  Submit Confirmation Record 🎯
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin View Applicants Modal */}
      {viewingApplicantsFor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 sm:p-8 animate-fade-in space-y-5 text-slate-900 dark:text-white max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Registered Applicants & Statistics</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Applied <b>{applicantStats.totalAppliedCount}</b> out of <b>{applicantStats.totalRegisteredStudents}</b> total registered students.
                </p>
              </div>
              <button onClick={() => setViewingApplicantsFor(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xl cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              {applicantStats.applicants.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-xs text-center py-8">No student applications recorded yet.</p>
              ) : (
                applicantStats.applicants.map((app) => (
                  <div key={app.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1.5 text-xs shadow-xs">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{app.name || app.student_name}</h4>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{app.email}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400"><strong>Location:</strong> {app.address || 'Not Provided'} {app.hometown ? `(Hometown: ${app.hometown})` : ''}</p>
                    <p className="text-slate-600 dark:text-slate-400"><strong>Notes:</strong> {app.additional_info}</p>
                    {app.screenshot_url && (
                      <div className="pt-1">
                        <a href={app.screenshot_url} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center gap-1">
                          📷 View Form Screenshot Proof
                        </a>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-900">Submitted on: {new Date(app.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Post Circular Modal with AI Parser */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 sm:p-8 animate-fade-in space-y-5 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                  Admin Placement Portal
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Publish Placement Circular 📢</h3>
              </div>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xl cursor-pointer">✕</button>
            </div>

            {/* AI Auto-Parser */}
            <div className="bg-indigo-50/50 dark:bg-slate-950 border-2 border-dashed border-indigo-300 dark:border-indigo-500/30 p-4 rounded-2xl space-y-2">
              <label className="block text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase">🤖 Paste Raw Circular Text for AI Auto-Fill:</label>
              <textarea 
                rows="3" 
                id="rawNoticeInput" 
                placeholder="Paste raw placement notice text (Company, role, eligibility, package, location, registration link)..." 
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              ></textarea>
              <button 
                type="button" 
                onClick={async () => {
                  const text = document.getElementById('rawNoticeInput').value;
                  if (!text) { showWarning("Please paste some circular text first!"); return; }
                  
                  const btn = document.activeElement;
                  btn.innerText = "Parsing with AI... 🤖";
                  try {
                    const res = await apiFetch('/api/admin/drives/parse-notice', {
                      method: 'POST',
                      body: JSON.stringify({ rawText: text })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setCompanyName(data.companyName || '');
                      setWebsite(data.website || '');
                      setNoticeType(data.noticeType || 'Job Drive');
                      setRole(data.role || '');
                      setPackageVal(data.packageVal || '');
                      setEligibility(data.eligibility || '');
                      setJobLocation(data.jobLocation || '');
                      setIsLocalOnly(data.isLocalOnly || false);
                      setInstructions(data.instructions || '');
                      setDeadlineText(data.deadlineText || '');
                      showSuccess("Form fields extracted automatically by AI!");
                    } else {
                      showError("Failed to parse circular text.");
                    }
                  } catch (e) {
                    showError("Network error parsing circular.");
                  }
                  btn.innerText = "Auto-Fill Form with AI ✨";
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
              >
                Auto-Fill Form with AI ✨
              </button>
            </div>

            <form onSubmit={handlePostDrive} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Company / Organization *</label>
                  <input 
                    type="text" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    required 
                    placeholder="e.g. Motadata, TCS, CRED" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Notice Category</label>
                  <select 
                    value={noticeType} 
                    onChange={(e) => setNoticeType(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Job Drive">Job Drive & Full-Time Hire</option>
                    <option value="Assessment Notice">Technical Assessment</option>
                    <option value="Internship Drive">Internship + PPO</option>
                    <option value="General Circular">General Placement Notice</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Job Roles / Positions *</label>
                  <input 
                    type="text" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)} 
                    required 
                    placeholder="e.g. Associate Software Engineer (SDE-1)" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">CTC Package *</label>
                  <input 
                    type="text" 
                    value={packageVal} 
                    onChange={(e) => setPackageVal(e.target.value)} 
                    required
                    placeholder="e.g. ₹7.50 - ₹12.00 LPA" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>

              {/* Location Restriction Fields */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">Job Location / City</label>
                    <input 
                      type="text" 
                      value={jobLocation} 
                      onChange={(e) => setJobLocation(e.target.value)} 
                      placeholder="e.g. Ahmedabad, Surat, Bengaluru" 
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none" 
                    />
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isLocalOnly} 
                        onChange={(e) => setIsLocalOnly(e.target.checked)} 
                        className="w-4 h-4 rounded text-indigo-500 cursor-pointer" 
                      />
                      <span className="font-bold text-amber-700 dark:text-amber-400 text-xs">Restrict to Local Students (Address Match)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Eligibility Criteria *</label>
                <textarea 
                  rows="3" 
                  value={eligibility} 
                  onChange={(e) => setEligibility(e.target.value)} 
                  required
                  placeholder="• Minimum 70% from Class 10 onwards, B.Tech CSE/IT, 0 Active Backlogs..." 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Official Registration Link *</label>
                  <input 
                    type="url" 
                    value={applyLink} 
                    onChange={(e) => setApplyLink(e.target.value)} 
                    required
                    placeholder="https://forms.gle/... or company careers URL" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Deadline Text</label>
                  <input 
                    type="text" 
                    value={deadlineText} 
                    onChange={(e) => setDeadlineText(e.target.value)} 
                    placeholder="e.g. Oct 28, 2026 - 5:00 PM" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowPostModal(false)} 
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md cursor-pointer"
                >
                  Publish Notice 📢
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}