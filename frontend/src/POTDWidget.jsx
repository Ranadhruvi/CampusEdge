import { streakManager } from './streakManager';
import React, { useState } from 'react';
import { triggerConfetti } from './confetti';
import { playSound } from './soundEffects';

const POTD_DATA = {
  id: "potd-2026-09-07",
  title: "Reverse Nodes in k-Group & Subnet Bitmasking",
  category: "DSA & Core CS",
  difficulty: "Medium",
  xpReward: 150,
  coinReward: 30,
  question: "Given the head of a linked list, reverse the nodes of the list 'k' at a time, and return the modified list. If the number of nodes is not a multiple of k, left-out nodes in the end should remain as they are.",
  options: [
    "Use recursion with auxiliary stack of size O(N)",
    "Iterative reverse with constant extra space O(1) by counting k nodes ahead",
    "Convert to dynamic array, reverse slices, and re-link list in O(N) space",
    "Two-pointer swap without pointer redirection"
  ],
  correctIndex: 1,
  explanation: "The optimal standard approach counts 'k' nodes forward. If present, reverse that contiguous window iteratively in O(1) auxiliary space, splice with the previous tail, and recurse/loop forward."
};

export default function POTDWidget({ onSolvePOTD }) {
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSolvedToday, setIsSolvedToday] = useState(false);

  const handleSelect = (idx) => {
    if (submitted) return;
    setSelectedOpt(idx);
    playSound('click');
  };

  const handleSubmit = () => {
    if (selectedOpt === null) return;
    setSubmitted(true);

    if (selectedOpt === POTD_DATA.correctIndex) {
      playSound('victory');
      triggerConfetti(2500);
      setIsSolvedToday(true);
      streakManager.recordActivity({
        type: 'potd',
        xp: POTD_DATA.xpReward,
        coins: POTD_DATA.coinReward,
        title: 'Solved Problem of the Day'
      });
    } else {
      playSound('wrong');
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 text-slate-900 dark:text-white rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-amber-500/30 shadow-lg dark:shadow-2xl relative overflow-hidden mb-6 transition-colors">
      <div className="hidden dark:block absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-400/40 flex items-center justify-center text-xl shadow-inner text-amber-600 dark:text-amber-400">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-amber-300">Problem of the Day (POTD)</h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950">
                DAILY +{POTD_DATA.xpReward} XP
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300">{POTD_DATA.category} • <span className="text-amber-600 dark:text-amber-400 font-bold">{POTD_DATA.difficulty}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Resets in:</span>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-600 dark:text-amber-300">
            03:24:19
          </span>
        </div>
      </div>

      {/* Question Body */}
      <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 mb-4">
        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed mb-3">
          {POTD_DATA.question}
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {POTD_DATA.options.map((opt, idx) => {
            let btnClass = "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-300";
            if (submitted) {
              if (idx === POTD_DATA.correctIndex) {
                btnClass = "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/40";
              } else if (idx === selectedOpt) {
                btnClass = "bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-800 dark:text-rose-200 font-bold";
              }
            } else if (selectedOpt === idx) {
              btnClass = "bg-indigo-50 dark:bg-indigo-900/80 border-indigo-500 dark:border-indigo-400 text-indigo-900 dark:text-white font-bold ring-2 ring-indigo-500/30";
            }

            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => handleSelect(idx)}
                className={`text-left p-3 rounded-xl text-xs border transition-all cursor-pointer flex items-start gap-2.5 ${btnClass}`}
              >
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation & Action Footer */}
      {submitted && (
        <div className={`p-3.5 rounded-2xl mb-4 text-xs ${
          isSolvedToday 
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2 font-black mb-1">
            <span>{isSolvedToday ? '🎉 Correct! Streak Extended (+150 XP, +30 Coins)' : '❌ Incorrect choice'}</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-normal">{POTD_DATA.explanation}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>💡 1,420 students solved today</span>
        </div>

        <div className="flex items-center gap-2">
          {!submitted ? (
            <button
              disabled={selectedOpt === null}
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-white dark:text-slate-950 font-black text-xs rounded-xl shadow-md transition transform active:scale-95 cursor-pointer"
            >
              Verify Answer ➔
            </button>
          ) : (
            <button
              onClick={() => onSolvePOTD && onSolvePOTD()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              Open Coding Arena ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
