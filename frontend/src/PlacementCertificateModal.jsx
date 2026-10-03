import React, { useRef } from 'react';
import Modal from './Modal';
import { triggerConfetti } from './confetti';
import { playSound } from './soundEffects';

export default function PlacementCertificateModal({ isOpen, onClose, student, readinessIndex = 88 }) {
  const certRef = useRef(null);

  const certId = "CE-" + (student?._id || "202688").slice(-6).toUpperCase() + "-" + Math.floor(Math.random() * 8999 + 1000);
  const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const studentName = student?.name || "Student Candidate";

  const handleDownload = () => {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      className="border border-slate-200 dark:border-indigo-500/40"
      showCloseButton={true}
      title="Certificate of Placement Readiness"
    >
      {/* Certificate Preview Card */}
      <div ref={certRef} className="bg-gradient-to-b from-slate-50 via-indigo-50/50 to-slate-50 dark:from-slate-950 dark:via-indigo-950/60 dark:to-slate-950 p-6 sm:p-8 rounded-2xl border-2 border-indigo-300 dark:border-indigo-500/50 relative overflow-hidden shadow-inner text-center mb-6">
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
    </Modal>
  );
}
