import React, { useRef } from 'react';
import Modal from './Modal';
import { triggerConfetti } from './confetti';
import { playSound } from './soundEffects';

export default function PlacementCertificateModal({ 
  isOpen, 
  onClose, 
  student, 
  readinessIndex = 88,
  isUnlocked = false,
  completedTasksCount = 0,
  onStartTask
}) {
  const certRef = useRef(null);

  const certId = "CE-" + (student?._id || "202688").slice(-6).toUpperCase() + "-" + Math.floor(Math.random() * 8999 + 1000);
  const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const studentName = student?.name || "Student Candidate";

  const handleDownload = () => {
    if (!isUnlocked) {
      playSound('error');
      return;
    }

    playSound('victory');
    triggerConfetti(2500);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 800);

    // Outer Border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, 1140, 740);

    // Inner Gold Border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, 1110, 710);

    // Header Logo & Title
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAMPUSEDGE VERIFIED DIGITAL CREDENTIAL', 600, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px serif';
    ctx.fillText('Certificate of Placement Readiness', 600, 175);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText('THIS IS TO OFFICIALLY CERTIFY THAT', 600, 230);

    // Student Name
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(studentName, 600, 305);

    // Description text
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '18px sans-serif';
    ctx.fillText('has successfully validated engineering competencies across Data Structures, Core CS,', 600, 370);
    ctx.fillText('System Architecture, and AI-simulated technical interview assessments with Distinction.', 600, 400);

    // Metrics Box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(200, 445, 800, 110);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(200, 445, 800, 110);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(readinessIndex + '%', 350, 495);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Readiness Index', 350, 525);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('Grade A+', 600, 495);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Proficiency Band', 600, 525);

    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('Top 5%', 850, 495);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('National Percentile', 850, 525);

    // Footer Credentials & Signatures
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText('Verification ID: ' + certId, 90, 680);
    ctx.fillText('Issued: ' + issueDate, 90, 710);
    ctx.fillText('Issuer: CampusEdge AI Assessment Board', 90, 740);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'italic 20px serif';
    ctx.fillText('Dr. Arvind Menon', 1110, 690);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Director of Placement Assessment', 1110, 715);

    // Download PNG
    const link = document.createElement('a');
    link.download = `CampusEdge_Certificate_${studentName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleTaskClick = (tab) => {
    playSound('click');
    if (onStartTask) {
      onStartTask(tab);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      className="border border-slate-200 dark:border-indigo-500/40"
      showCloseButton={true}
      title={isUnlocked ? "Certificate of Placement Readiness" : "Certificate Locked — Prerequisite Required"}
    >
      {!isUnlocked ? (
        /* LOCKED STATE: Requirement Notice & Quick Action Cards */
        <div className="space-y-6">
          {/* Lock Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-500/40 relative overflow-hidden">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shrink-0">
                🔒
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-mono">
                    Task Prerequisite Required
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Placement Certificate Locked
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Official certificates are only generated after you complete at least <strong>1 verified placement task</strong> (such as an MCQ mock test, coding challenge, AI interview, or ATS resume review).
                </p>
              </div>
            </div>

            {/* Task Progress Bar */}
            <div className="mt-4 pt-3.5 border-t border-amber-200/60 dark:border-amber-700/40">
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">Tasks Completed</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">0 / 1 Task Completed</span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-slate-400 dark:bg-slate-700 rounded-full w-0 transition-all duration-500"></div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                <span>⚡ Complete any single task below to unlock and generate your official credential immediately.</span>
              </p>
            </div>
          </div>

          {/* Quick Tasks Grid */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Choose a Task to Unlock Certificate:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Mock Test */}
              <div 
                onClick={() => handleTaskClick('mockTests')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                  📝
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Take a Proctored Test
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    10-question MCQ test across DBMS, OS, Networks, or Aptitude.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    Start Test ➔
                  </span>
                </div>
              </div>

              {/* Option 2: Coding Arena */}
              <div 
                onClick={() => handleTaskClick('codingArena')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                  💻
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Solve a Coding Problem
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Solve DSA problems with in-browser multi-language compilation.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                    Open Coding Arena ➔
                  </span>
                </div>
              </div>

              {/* Option 3: AI Interview */}
              <div 
                onClick={() => handleTaskClick('aiInterview')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    AI Technical Interview
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Simulate real company viva rounds with instant feedback.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    Launch Interview ➔
                  </span>
                </div>
              </div>

              {/* Option 4: ATS Resume Audit */}
              <div 
                onClick={() => handleTaskClick('resumeChecker')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Scan Resume with ATS
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Run an automated audit on your resume keywords and formatting.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Audit Resume ➔
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Blurred / Watermarked Certificate Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 select-none">
            <div className="opacity-25 filter blur-xs p-6 bg-slate-100 dark:bg-slate-950 text-center">
              <div className="font-serif text-lg font-black text-slate-600 dark:text-slate-400">
                Certificate of Placement Readiness
              </div>
              <p className="text-sm font-bold text-slate-500 mt-2">{studentName}</p>
              <div className="text-xs text-slate-400 mt-1">Readiness Score: {readinessIndex}%</div>
            </div>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center text-2xl mb-2 shadow-lg">
                🔒
              </div>
              <p className="text-xs font-black tracking-wider uppercase text-amber-300">
                Preview Watermark: Verification Locked
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 max-w-sm">
                Complete any test or challenge above to generate your high-resolution verified credential.
              </p>
            </div>
          </div>

          {/* Locked Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-mono text-slate-400">
              Prerequisite: 1 Task Completed
            </span>
            <button
              type="button"
              disabled={true}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs cursor-not-allowed flex items-center gap-2 border border-slate-300 dark:border-slate-700"
            >
              <span>🔒</span>
              <span>Download Locked (Complete 1 Task)</span>
            </button>
          </div>
        </div>
      ) : (
        /* UNLOCKED STATE: Full Verified Certificate Preview & Download */
        <div className="space-y-6">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <span>✅</span>
              <span>Placement Activity Verified! You have completed {completedTasksCount} {completedTasksCount === 1 ? 'task' : 'tasks'}.</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono">
              UNLOCKED
            </span>
          </div>

          {/* Certificate Preview Card */}
          <div ref={certRef} className="bg-gradient-to-b from-slate-50 via-indigo-50/50 to-slate-50 dark:from-slate-950 dark:via-indigo-950/60 dark:to-slate-950 p-6 sm:p-8 rounded-2xl border-2 border-indigo-300 dark:border-indigo-500/50 relative overflow-hidden shadow-inner text-center">
            <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-400/40 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold rounded-full mb-3">
              VERIFIED CREDENTIAL • ID: {certId}
            </div>

            <h2 id="modal-title" className="text-xl sm:text-2xl font-serif font-black text-slate-900 dark:text-amber-400 mb-1">
              Certificate of Placement Readiness
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
              CampusEdge National Assessment Authority
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-300 mb-1">Presented to</p>
            <p className="text-2xl font-black text-indigo-700 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-400 dark:via-indigo-300 dark:to-purple-400 mb-3">
              {studentName}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
              For demonstrating verified excellence in algorithmic problem solving, core computer science fundamentals, and simulated technical interviews.
            </p>

            <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center font-mono shadow-xs">
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 text-base font-black">{readinessIndex}%</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Readiness Score</p>
              </div>
              <div>
                <p className="text-amber-600 dark:text-amber-400 text-base font-black">Grade A+</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Proficiency</p>
              </div>
              <div>
                <p className="text-indigo-600 dark:text-cyan-400 text-base font-black">Top 5%</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Percentile</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Issued: {issueDate}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-xs text-white shadow-md shadow-emerald-500/20 transition transform hover:scale-105 cursor-pointer flex items-center gap-2"
              >
                <span>📥</span>
                <span>Download Official PNG / PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
