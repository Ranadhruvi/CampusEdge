import React, { useState, useEffect } from 'react';
import { streakManager } from './streakManager';
import { playSound } from './soundEffects';

export default function GamificationHeader({ 
  onStreakClick, 
  onClaimCert 
}) {
  const [streakData, setStreakData] = useState(streakManager.getState());

  useEffect(() => {
    const unsubscribe = streakManager.subscribe(setStreakData);
    return () => unsubscribe();
  }, []);

  const streak = streakData.currentStreak || 1;
  const xp = streakData.totalXP || 250;
  const level = streakData.level || 1;
  const levelTitle = streakData.levelTitle || 'Placement Ready';
  const coins = streakData.coins || 50;

  const currentLevelXP = xp % 1000;
  const progressPercent = Math.min(100, Math.round((currentLevelXP / 1000) * 100));

  return (
    <div className="w-full bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-slate-900 dark:text-white rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-indigo-500/30 shadow-lg shadow-indigo-100/50 dark:shadow-2xl relative overflow-hidden backdrop-blur-xl mb-6 transition-colors">
      {/* Background glow lines in dark mode */}
      <div className="hidden dark:block absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden dark:block absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Streak & Rank Badge */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Streak Flame (Click to open Real-Time Streak Hub) */}
          <div 
            onClick={() => { playSound('click'); onStreakClick && onStreakClick(); }}
            className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-200 dark:border-amber-400/40 rounded-2xl cursor-pointer hover:scale-105 transition shadow-xs group"
            title="Click to view live streak calendar, quests & countdown!"
          >
            <span className="text-2xl group-hover:scale-125 transition-transform animate-bounce">🔥</span>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-amber-800 dark:text-amber-300">{streak} Day Streak</span>
                <span className="text-[10px] bg-amber-200/60 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold px-1.5 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-200/80 font-medium">
                {streakData.isStreakActiveToday ? 'Active Today ✨' : `Expires in ${streakData.countdown?.formatted || '12h'}`}
              </p>
            </div>
          </div>

          {/* User Rank & Level */}
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-md">
              L{level}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white">{levelTitle}</span>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 rounded-md">Rank #14</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">{xp} Total Placement XP</p>
            </div>
          </div>

          {/* Campus Coins */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl">
            <span className="text-lg">🪙</span>
            <span className="text-xs font-black text-amber-800 dark:text-amber-300">{coins} Coins</span>
          </div>
        </div>

        {/* Right: XP Progress Bar & Quick Action */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
          {/* Level Progress */}
          <div className="w-full sm:w-52">
            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              <span>Next: Level {level + 1}</span>
              <span className="text-indigo-600 dark:text-indigo-300">{currentLevelXP} / 1000 XP</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Verified Certificate CTA */}
          <button
            onClick={() => { playSound('click'); onClaimCert && onClaimCert(); }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>🏆</span>
            <span>Digital Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
