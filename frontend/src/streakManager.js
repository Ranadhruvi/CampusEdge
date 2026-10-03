// Real-Time Streak & Gamification Manager with Live Event Broadcast & Offline Sync
import { apiFetch } from './api';
import { playSound } from './soundEffects';
import { triggerConfetti } from './confetti';

class StreakManager {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadLocalState();
    this.interval = null;
    this.startCountdownTicker();
  }

  getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  getDayOfWeek() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
  }

  loadLocalState() {
    const today = this.getTodayKey();
    const dayKey = this.getDayOfWeek();
    try {
      const saved = localStorage.getItem('campusedge_realtime_streak');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastActiveDate !== today) {
          // Check if day changed
          parsed.isStreakActiveToday = false;
          parsed.todayXP = 0;
        }
        return parsed;
      }
    } catch (e) {}

    const initial = {
      currentStreak: 5,
      longestStreak: 12,
      lastActiveDate: today,
      isStreakActiveToday: true,
      todayXP: 150,
      totalXP: 2450,
      coins: 480,
      level: 4,
      levelTitle: 'Placement Ready',
      streakFreeze: 1,
      weeklyActivity: { Mon: true, Tue: true, Wed: false, Thu: true, Fri: false, Sat: false, Sun: false },
      todayQuests: { potd: false, practice: false, mock: false, duel: false, interview: false },
      recentHistory: [
        { type: 'potd', title: 'Problem of the Day', xp: 150, coins: 30, time: '10:30 AM', date: today },
        { type: 'practice', title: '10-Min DSA Sprint', xp: 100, coins: 20, time: 'Yesterday', date: '2026-09-09' }
      ]
    };
    initial.weeklyActivity[dayKey] = true;
    return initial;
  }

  saveLocalState(state) {
    this.state = { ...this.state, ...state };
    try {
      localStorage.setItem('campusedge_realtime_streak', JSON.stringify(this.state));
    } catch (e) {}
    this.notify();
  }

  startCountdownTicker() {
    if (typeof window === 'undefined') return;
    this.interval = setInterval(() => {
      this.notify();
    }, 1000);
  }

  getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const diff = Math.max(0, midnight - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      hours,
      minutes,
      seconds,
      formatted: `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const current = this.getState();
    this.listeners.forEach(l => {
      try { l(current); } catch (e) {}
    });
  }

  getState() {
    const countdown = this.getTimeUntilMidnight();
    return {
      ...this.state,
      countdown
    };
  }

  async syncWithBackend(email) {
    if (!email || email === 'default@student.com') return;
    try {
      const res = await apiFetch(`/api/student/streak/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        this.saveLocalState(data);
      }
    } catch (e) {
      console.warn('Real-time streak offline sync active');
    }
  }

  async recordActivity({ type = 'practice', xp = 100, coins = 20, title = 'Completed Learning Task' }) {
    const today = this.getTodayKey();
    const dayKey = this.getDayOfWeek();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let currentStreak = this.state.currentStreak || 0;
    if (!this.state.isStreakActiveToday) {
      currentStreak += 1;
    }
    const longestStreak = Math.max(this.state.longestStreak || 0, currentStreak);
    const totalXP = (this.state.totalXP || 0) + xp;
    const todayXP = (this.state.todayXP || 0) + xp;
    const totalCoins = (this.state.coins || 0) + coins;
    const level = Math.floor(totalXP / 1000) + 1;
    const levelTitles = ['Novice Aspirant', 'Code Apprentice', 'Skill Specialist', 'Placement Ready', 'Elite SDE', 'Campus Prodigy'];
    const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

    const weeklyActivity = { ...(this.state.weeklyActivity || {}) };
    weeklyActivity[dayKey] = true;

    const todayQuests = { ...(this.state.todayQuests || {}) };
    if (type) {
      todayQuests[type] = true;
    }

    const recentHistory = [
      { type, title, xp, coins, time: timeStr, date: today },
      ...(this.state.recentHistory || [])
    ].slice(0, 20);

    const updatedState = {
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      isStreakActiveToday: true,
      todayXP,
      totalXP,
      coins: totalCoins,
      level,
      levelTitle,
      weeklyActivity,
      todayQuests,
      recentHistory
    };

    this.saveLocalState(updatedState);
    playSound('correct');
    triggerConfetti(1800);

    // Sync to backend asynchronously
    try {
      const savedUser = localStorage.getItem('user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      if (user && user.email) {
        apiFetch('/api/student/streak/record-activity', {
          method: 'POST',
          body: JSON.stringify({
            email: user.email,
            type,
            xp,
            coins,
            title
          })
        }).catch(() => {});
      }
    } catch (e) {}

    return updatedState;
  }
}

export const streakManager = new StreakManager();
