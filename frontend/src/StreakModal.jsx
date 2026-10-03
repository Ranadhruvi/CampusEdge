import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { streakManager } from './streakManager';
import { triggerConfetti } from './confetti';
import { playSound } from './soundEffects';

const QUEST_CONFIG = [
  { id: 'potd', label: 'Solve Problem of the Day (POTD)', xp: 150, icon: '⚡' },
  { id: 'practice', label: 'Complete 1 Topic Practice Quiz', xp: 100, icon: '🎯' },
  { id: 'duel', label: 'Play 1v1 Placement Speed Duel', xp: 100, icon: '⚔️' },
  { id: 'mock', label: 'Complete 1 Proctored Mock Test', xp: 200, icon: '📝' },
  { id: 'interview', label: 'AI Bar-Raiser Interview Session', xp: 250, icon: '🎙️' }
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StreakModal({ isOpen, onClose }) {
  const [streakData, setStreakData] = useState(streakManager.getState());
  const [claimedBonus, setClaimedBonus] = useState(false);

  useEffect(() => {
    const unsubscribe = streakManager.subscribe(setStreakData);
    return () => unsubscribe();
  }, []);

  const handleClaimBonus = async () => {
    if (claimedBonus) return;
    setClaimedBonus(true);
    await streakManager.recordActivity({
      type: 'bonus',
      xp: 75,
      coins: 25,
      title: 'Daily Practice Flame Bonus Claimed'
    });
    playSound('victory');
    triggerConfetti(3000);
  };

  const completedQuestsCount = Object.values(streakData.todayQuests || {}).filter(Boolean).length;
  const totalQuestsCount = QUEST_CONFIG.length;
  const questProgress = Math.round((completedQuestsCount / totalQuestsCount) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      className="border border-slate-200 dark:border-indigo-500/40"
      showCloseButton={true}
      title={`${streakData.currentStreak} Day Practice Streak!`}
    >
      {/* Top Flame Hero */}
      <div className="text-center mb-6">
        <div className="relative inline-block mb-2">
          <span className="text-6xl sm:text-7xl animate-bounce inline-block">🔥</span>
          <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        </div>
        
        <h2 id="modal-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {streakData.currentStreak} Day Practice Streak!
        </h2>
        
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
          {streakData.isStreakActiveToday
            ? "You've extended your streak today! Keep practicing to maximize placement ranking."
            : "Complete any quiz, coding problem, or interview round today to keep your streak alive!"}
        </p>

        {/* Real-Time Countdown to Midnight */}
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/30 text-amber-800 dark:text-amber-300 font-mono text-xs font-black">
          <span>⏱️ Resets in:</span>
          <span>{streakData.countdown?.formatted || '00h 00m 00s'}</span>
        </div>
      </div>

      {/* 7-Day Weekly Activity Calendar */}
      <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">This Week's Activity</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            {Object.values(streakData.weeklyActivity || {}).filter(Boolean).length}/7 Days Active
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = Boolean(streakData.weeklyActivity?.[day]);
            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-lg font-bold border transition-all ${
                  isActive
                    ? 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white border-amber-300 shadow-md shadow-amber-500/30 scale-105'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  {isActive ? '🔥' : '•'}
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Placement Quest Checklist */}
      <div className="space-y-2.5 mb-6">
        <div className="flex justify-between items-center text-xs font-bold mb-1">
          <span className="text-slate-700 dark:text-slate-300">Daily Placement Quests</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-black">{completedQuestsCount} / {totalQuestsCount} Completed</span>
        </div>

        {/* Quest Progress Bar */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
            style={{ width: `${questProgress}%` }}
          />
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {QUEST_CONFIG.map((q) => {
            const isDone = Boolean(streakData.todayQuests?.[q.id]);
            return (
              <div
                key={q.id}
                className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  isDone
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{q.icon}</span>
                  <span className="font-semibold">{q.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
                    +{q.xp} XP
                  </span>
                  <span className="text-base">{isDone ? '✅' : '⏳'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim Daily Bonus / Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <span>🛡️ Streak Freeze:</span>
          <span className="text-indigo-600 dark:text-indigo-300 font-mono">
            {streakData.streakFreeze || 1} Available
          </span>
        </div>

        <button
          onClick={handleClaimBonus}
          disabled={claimedBonus}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-500/20 transition transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>🎁</span>
          <span>{claimedBonus ? 'Bonus Claimed Today!' : 'Claim Daily Flame Bonus (+75 XP)'}</span>
        </button>
      </div>
    </Modal>
  );
}
