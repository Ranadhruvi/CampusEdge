import React, { useState, useEffect, useRef } from 'react';
import { playSound } from './soundEffects';

const QUICK_ACTIONS = [
  { id: 'dashboard', title: 'Open Student Dashboard', category: 'Navigation', icon: '📊' },
  { id: 'codingArena', title: 'Coding Arena & Code Whiteboard', category: 'Coding', icon: '💻' },
  { id: 'mockTests', title: 'Start Full Campus Mock Test', category: 'Assessments', icon: '📝' },
  { id: 'practice', title: 'Practice Topic Questions', category: 'Assessments', icon: '🎯' },
  { id: 'aiInterview', title: 'AI Video/Voice Interview Simulator', category: 'AI Intelligence', icon: '🎙️' },
  { id: 'resumeChecker', title: 'Resume ATS & JD Tailor Analyzer', category: 'AI Intelligence', icon: '📄' },
  { id: 'eligibility', title: 'Company Cutoff & Eligibility Checker', category: 'Placements', icon: '🏢' },
  { id: 'drives', title: 'Active Placement Drives & Circulars', category: 'Placements', icon: '📢' },
  { id: 'progress', title: 'My Progress & Growth Analytics', category: 'Analytics', icon: '📈' },
  { id: 'leaderboard', title: 'College & Global Leaderboard', category: 'Social', icon: '🏆' },
  { id: 'roadmap', title: 'Company Specific Prep Roadmaps', category: 'Guidance', icon: '🗺️' }
];

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  const filtered = QUICK_ACTIONS.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIdx(0);
      setQuery('');
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => (i + 1) % (filtered.length || 1));
      playSound('click');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => (i - 1 + filtered.length) % (filtered.length || 1));
      playSound('click');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIdx]) {
        handleSelect(filtered[selectedIdx]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (item) => {
    playSound('click');
    onNavigate(item.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-white animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <span className="text-indigo-600 dark:text-indigo-400 text-lg">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, assessment, or feature... (Esc to close)"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium"
          />
          <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching commands found. Try "mock test", "interview", or "1v1".
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-semibold cursor-pointer transition-all ${
                  idx === selectedIdx
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                  idx === selectedIdx ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {item.category}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>•</span>
            <span>↵ Select</span>
          </div>
          <span>CampusEdge Spotlight</span>
        </div>
      </div>
    </div>
  );
}
