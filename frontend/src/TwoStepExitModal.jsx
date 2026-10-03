import React, { useState } from 'react';
import Modal from './Modal';

/**
 * TwoStepExitModal
 * Enforces a strict 2-step confirmation sequence before a student can forfeit/exit an active test.
 * Wrapped with accessible Modal component.
 */
export default function TwoStepExitModal({
  isOpen,
  onClose,
  onConfirmExit,
  testTitle = 'Examination Assessment',
  tabSwitches = 0
}) {
  const [step, setStep] = useState(1);
  const [acknowledgedImpact, setAcknowledgedImpact] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');

  const handleResetAndClose = () => {
    setStep(1);
    setAcknowledgedImpact(false);
    setConfirmPhrase('');
    onClose();
  };

  const handleFinalConfirm = () => {
    setStep(1);
    setAcknowledgedImpact(false);
    setConfirmPhrase('');
    onConfirmExit();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      maxWidth="max-w-lg"
      className="border-2 border-rose-500/80"
      title="Two-Step Exit Verification"
      closeOnEscape={true}
      closeOnBackdropClick={true}
    >
      {/* Step Indicator Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 font-black text-sm flex items-center justify-center">
            ⚠️
          </span>
          <div>
            <h3 id="modal-title" className="font-black text-base text-slate-900 dark:text-white">
              Two-Step Exit Verification
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {testTitle} • Proctoring Security Protocol
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-black text-slate-700 dark:text-slate-300">
          <span className={step === 1 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>Step 1</span>
          <span>/</span>
          <span className={step === 2 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>Step 2</span>
        </div>
      </div>

      {/* STEP 1: IMPACT & FORFEITURE WARNING */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-rose-50 dark:bg-rose-950/50 p-4 rounded-2xl border border-rose-200 dark:border-rose-500/40 space-y-2.5">
            <h4 className="font-black text-xs text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-2">
              <span>🚨</span> Assessment Forfeiture Notice
            </h4>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Your attempt will be finalized and submitted immediately.</li>
              <li>All unanswered questions will be marked as incorrect (0 points).</li>
              <li>
                Your proctoring integrity record ({tabSwitches} tab {tabSwitches === 1 ? 'switch' : 'switches'}) will be saved to the database.
              </li>
              <li>Recruiters and admins can inspect this forfeited attempt.</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledgedImpact}
              onChange={(e) => setAcknowledgedImpact(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700 cursor-pointer"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
              I understand the consequences and wish to proceed to the final confirmation step.
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
            >
              ← Resume Assessment
            </button>

            <button
              type="button"
              disabled={!acknowledgedImpact}
              onClick={() => setStep(2)}
              className={`flex-1 py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                acknowledgedImpact
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              Proceed to Step 2 ➔
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: EXPLICIT CONFIRMATION PHRASE OR FINAL CLICK */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Type <strong className="font-mono text-rose-600 dark:text-rose-400 font-bold">EXIT</strong> below to confirm you are permanently forfeiting this session:
            </p>
            <input
              type="text"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value.toUpperCase())}
              placeholder="Type EXIT to confirm"
              className="w-full text-center tracking-widest font-mono font-black uppercase text-sm py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow-md"
            >
              ← Keep Testing & Return
            </button>

            <button
              type="button"
              disabled={confirmPhrase !== 'EXIT'}
              onClick={handleFinalConfirm}
              className={`flex-1 py-3 rounded-xl font-black text-xs transition ${
                confirmPhrase === 'EXIT'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 cursor-pointer animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              🚨 Terminate & Exit
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
