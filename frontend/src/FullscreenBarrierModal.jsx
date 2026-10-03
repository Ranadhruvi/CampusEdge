import React from 'react';
import Modal from './Modal';

/**
 * FullscreenBarrierModal
 * Appears whenever fullscreen mode is lost during an active assessment,
 * preventing candidates from interacting with test content until re-entering fullscreen.
 * Wrapped with accessible Modal component.
 */
export default function FullscreenBarrierModal({
  isOpen,
  onReEnterFullscreen,
  title = "Examination In Progress"
}) {
  return (
    <Modal
      isOpen={isOpen}
      closeOnEscape={false}
      closeOnBackdropClick={false}
      maxWidth="max-w-md"
      className="border-2 border-indigo-500 text-center"
      zIndex="z-[99998]"
      title="Fullscreen Mode Required"
    >
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 text-3xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
        🖥️
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
          Security Enforcement
        </span>
        <h3 id="modal-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Fullscreen Mode Required
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          To maintain strict testing integrity and prevent unauthorized tool access, <strong>{title}</strong> must be conducted in full screen.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
        <p className="font-bold text-slate-900 dark:text-white">Examination Instructions:</p>
        <ul className="text-[11px] space-y-1 list-disc list-inside">
          <li>Click the button below to resume fullscreen view.</li>
          <li>Do not press Esc or switch applications during testing.</li>
          <li>All exits and window blurs are logged.</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onReEnterFullscreen}
        className="w-full py-3.5 rounded-xl font-black text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
      >
        <span>🖥️</span>
        <span>Re-Enter Fullscreen Examination ➔</span>
      </button>
    </Modal>
  );
}
