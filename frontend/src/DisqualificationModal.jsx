import React from 'react';
import Modal from './Modal';

/**
 * DisqualificationModal
 * Displayed when candidate reaches 3 proctoring violations (tab switches / window blurs),
 * informing them that their session has been automatically forfeited and submitted.
 * Wrapped with accessible Modal component.
 */
export default function DisqualificationModal({
  isOpen,
  onAcknowledge,
  testTitle = "Assessment",
  tabSwitches = 3,
  violationLogs = []
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onAcknowledge}
      closeOnEscape={false}
      closeOnBackdropClick={false}
      maxWidth="max-w-lg"
      className="border-4 border-rose-600 text-center"
      title="Assessment Auto-Terminated"
    >
      {/* Pulsing Alarm Icon */}
      <div className="w-20 h-20 rounded-3xl bg-rose-100 dark:bg-rose-950/90 border-2 border-rose-400 dark:border-rose-500 text-rose-600 dark:text-rose-400 text-4xl flex items-center justify-center mx-auto shadow-inner animate-bounce">
        🚨
      </div>

      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-3.5 py-1 rounded-full border border-rose-300 dark:border-rose-500/50">
          3-Strike Proctoring Policy Triggered
        </span>
        <h2 id="modal-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Assessment Auto-Terminated
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
          You exceeded the maximum threshold of <strong className="text-rose-600 dark:text-rose-400 font-bold">{tabSwitches} tab switches / window unfocus events</strong> during <strong>{testTitle}</strong>.
        </p>
      </div>

      {/* Audit Details */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2.5 text-xs">
        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-bold">
          <span>Integrity Action Logged</span>
          <span className="text-rose-600 dark:text-rose-400 font-black">High-Risk Flagged</span>
        </div>
        <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>Your session was submitted immediately as-is.</li>
          <li>Unanswered questions were marked 0 / forfeited.</li>
          <li>Violation timestamps and focus loss audit logs are saved for administrator review.</li>
        </ul>

        {violationLogs.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Violation Timestamps:</span>
            <div className="grid grid-cols-1 gap-1">
              {violationLogs.slice(0, 3).map((log, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between text-[10px]">
                  <span className="font-bold text-rose-600">Violation #{idx + 1}</span>
                  <span className="font-mono text-slate-500">{log.timestamp} ({log.type || 'Tab Switch'})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAcknowledge}
        className="w-full py-4 rounded-2xl font-black text-xs bg-gradient-to-r from-rose-600 via-rose-700 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-xl shadow-rose-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
      >
        I Understand & Return to Dashboard ➔
      </button>
    </Modal>
  );
}
