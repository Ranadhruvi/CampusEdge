import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from './api';

export default function Leaderboard({ userEmail, onBack }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'tests' | 'interviews'
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/leaderboard?userEmail=${encodeURIComponent(userEmail || '')}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 20000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // Filter and sort data
  const filteredAndSorted = useMemo(() => {
    let list = [...leaderboardData];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.name || '').toLowerCase().includes(q)
      );
    }

    // Sort by filter mode
    if (filterMode === 'tests') {
      list.sort((a, b) => (parseInt(b.test_points || b.total_score || 0, 10)) - (parseInt(a.test_points || a.total_score || 0, 10)));
    } else if (filterMode === 'interviews') {
      list.sort((a, b) => (parseInt(b.interview_points || b.total_score || 0, 10)) - (parseInt(a.interview_points || a.total_score || 0, 10)));
    } else {
      list.sort((a, b) => parseInt(b.total_score || 0, 10) - parseInt(a.total_score || 0, 10));
    }

    return list;
  }, [leaderboardData, searchQuery, filterMode]);

  // Overall Statistics
  const totalCompetitors = leaderboardData.length;
  const totalTestsAttempted = leaderboardData.reduce((sum, s) => sum + parseInt(s.tests_completed || 0, 10), 0);
  const totalInterviewsAttempted = leaderboardData.reduce((sum, s) => sum + parseInt(s.interviews_completed || 0, 10), 0);
  const topScore = leaderboardData.length > 0 ? leaderboardData[0].total_score : 0;

  // Find Current User Standing
  const currentUserIndex = leaderboardData.findIndex(s => s.isCurrentUser || s.email === userEmail);
  const currentUser = currentUserIndex !== -1 ? leaderboardData[currentUserIndex] : null;
  const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : null;

  // Top 3 Podium
  const top1 = leaderboardData[0] || null;
  const top2 = leaderboardData[1] || null;
  const top3 = leaderboardData[2] || null;

  const getTierBadge = (score) => {
    const s = parseInt(score || 0, 10);
    if (s >= 500) return { label: "💎 Diamond Legend", color: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border-cyan-300 dark:border-cyan-500/40" };
    if (s >= 300) return { label: "🏆 Master Tier", color: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 border-purple-300 dark:border-purple-500/40" };
    if (s >= 150) return { label: "⚡ Elite Candidate", color: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-500/40" };
    if (s >= 50) return { label: "🔥 Rising Challenger", color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-500/40" };
    return { label: "🌱 Recruit", color: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700/40" };
  };

  const getAvatarGradient = (index) => {
    const gradients = [
      "from-amber-400 via-yellow-500 to-amber-600",
      "from-slate-400 via-gray-500 to-slate-600",
      "from-amber-700 via-orange-600 to-amber-900",
      "from-indigo-500 to-purple-600",
      "from-emerald-500 to-teal-600",
      "from-rose-500 to-pink-600"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7 animate-fade-in pb-16 text-slate-900 dark:text-white font-sans">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <button 
            onClick={onBack} 
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition flex items-center gap-1.5 mb-1.5 cursor-pointer"
          >
            ← Back to Student Dashboard
          </button>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/30 px-3 py-1 rounded-full mb-1.5">
            <span>🏆</span> Live Campus Placement Leaderboard
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hall of Fame & Candidate Standings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
            Real-time rankings based on mock test precision, technical DSA skills, and AI speech interview evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Live Auto-Sync</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold">{lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-xl shrink-0">
            🥇
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Peak Score</span>
            <span className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400">{topScore} <span className="text-xs text-amber-600/70 font-normal">pts</span></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
            👥
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Competitors</span>
            <span className="text-lg sm:text-xl font-black text-indigo-700 dark:text-indigo-400">{totalCompetitors} <span className="text-xs text-indigo-600/70 font-normal">candidates</span></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
            📝
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Mock Tests</span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400">{totalTestsAttempted} <span className="text-xs text-emerald-600/70 font-normal">completed</span></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-xl shrink-0">
            🎙️
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">AI Interviews</span>
            <span className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-400">{totalInterviewsAttempted} <span className="text-xs text-purple-600/70 font-normal">cleared</span></span>
          </div>
        </div>
      </div>

      {/* 3D CHAMPION PODIUM (TOP 3) */}
      {leaderboardData.length >= 2 && (
        <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          
          {/* Subtle Ambient Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-indigo-500/10 blur-3xl pointer-events-none"></div>

          <div className="text-center mb-6 relative">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
              ⚡ Top Tier Placement Champions
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-4">
            
            {/* Rank 2 (Silver) */}
            {top2 ? (
              <div className="flex flex-col items-center text-center space-y-2 order-1">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 p-0.5 shadow-lg">
                    <div className="w-full h-full bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center font-black text-slate-800 dark:text-slate-200 text-sm sm:text-lg">
                      {top2.name ? top2.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  </div>
                  <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow">
                    🥈
                  </span>
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-[90px] sm:max-w-[140px]">{top2.name || 'Candidate'}</h3>
                  <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 block">{top2.total_score} pts</span>
                  <span className="text-[10px] text-slate-500 hidden sm:block font-medium">{top2.tests_completed} tests • {top2.interviews_completed} interviews</span>
                </div>
                <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-800/90 dark:to-slate-900/90 border border-slate-300 dark:border-slate-700/60 flex items-center justify-center text-xs font-black text-slate-800 dark:text-slate-300 shadow-sm">
                  #2
                </div>
              </div>
            ) : <div className="order-1"></div>}

            {/* Rank 1 (Gold - Center & Taller) */}
            {top1 ? (
              <div className="flex flex-col items-center text-center space-y-2 order-2 -mt-4">
                <div className="relative">
                  <span className="text-2xl sm:text-3xl block animate-bounce mb-1">👑</span>
                  <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-1 shadow-2xl ring-4 ring-amber-400/20">
                    <div className="w-full h-full bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center font-black text-amber-600 dark:text-amber-300 text-lg sm:text-2xl">
                      {top1.name ? top1.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                  </div>
                  <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg">
                    🥇
                  </span>
                </div>
                <div className="pt-1">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base truncate max-w-[110px] sm:max-w-[170px]">{top1.name || 'Champion'}</h3>
                  <span className="text-sm sm:text-base font-black text-amber-700 dark:text-amber-400 block">{top1.total_score} pts</span>
                  <span className="text-[10px] text-amber-800 dark:text-amber-400/80 font-bold hidden sm:block">🏆 Campus Grandmaster</span>
                </div>
                <div className="w-full h-28 sm:h-32 rounded-t-2xl bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 dark:from-amber-500/20 dark:via-slate-800 dark:to-slate-900 border border-amber-300 dark:border-amber-500/40 flex items-center justify-center text-sm font-black text-amber-900 dark:text-amber-300 shadow-inner">
                  #1
                </div>
              </div>
            ) : <div className="order-2"></div>}

            {/* Rank 3 (Bronze) */}
            {top3 ? (
              <div className="flex flex-col items-center text-center space-y-2 order-3">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-amber-700 to-orange-500 p-0.5 shadow-lg">
                    <div className="w-full h-full bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center font-black text-amber-800 dark:text-amber-400 text-sm sm:text-lg">
                      {top3.name ? top3.name.charAt(0).toUpperCase() : 'B'}
                    </div>
                  </div>
                  <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
                    🥉
                  </span>
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-[90px] sm:max-w-[140px]">{top3.name || 'Candidate'}</h3>
                  <span className="text-xs sm:text-sm font-black text-amber-800 dark:text-amber-500 block">{top3.total_score} pts</span>
                  <span className="text-[10px] text-slate-500 hidden sm:block font-medium">{top3.tests_completed} tests • {top3.interviews_completed} interviews</span>
                </div>
                <div className="w-full h-16 sm:h-20 rounded-t-2xl bg-gradient-to-b from-orange-100 to-amber-200 dark:from-slate-800/90 dark:to-slate-900/90 border border-amber-300 dark:border-slate-700/60 flex items-center justify-center text-xs font-black text-amber-900 dark:text-amber-600 shadow-sm">
                  #3
                </div>
              </div>
            ) : <div className="order-3"></div>}

          </div>
        </div>
      )}

      {/* CURRENT USER STANDING BANNER */}
      {currentUser && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-white dark:from-indigo-950/90 dark:via-purple-950/80 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg ring-2 ring-indigo-400/40 shrink-0">
              #{currentUserRank}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">{currentUser.name || 'You'}</h3>
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/80 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">Your Live Standing</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Tests: <strong className="text-slate-900 dark:text-white">{currentUser.tests_completed}</strong> • AI Interviews: <strong className="text-slate-900 dark:text-white">{currentUser.interviews_completed}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Your Score</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{currentUser.total_score} <span className="text-xs text-slate-500 dark:text-slate-400">pts</span></span>
            </div>
            <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Rank Tier</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">{getTierBadge(currentUser.total_score).label.split(' ')[1]}</span>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input 
              type="text"
              placeholder="Search candidate name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-xl font-medium text-slate-900 dark:text-white text-xs outline-none shadow-xs"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterMode === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔥 Overall Standings
            </button>
            <button
              onClick={() => setFilterMode('tests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterMode === 'tests' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📝 Test Masters
            </button>
            <button
              onClick={() => setFilterMode('interviews')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterMode === 'interviews' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🎙️ AI Interview Aces
            </button>
          </div>

        </div>
      </div>

      {/* FULL LEADERBOARD LIST */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {loading && leaderboardData.length === 0 ? (
          <div className="text-center py-24 text-slate-500 dark:text-slate-400 font-bold text-xs space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading real-time candidate rankings...</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-xs">
            <span className="text-3xl block mb-2">🎯</span>
            <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">No candidate records match your search.</p>
            <p>Try clearing filters or taking a new placement test.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredAndSorted.map((student, index) => {
              const rank = index + 1;
              const isCurrentUser = student.isCurrentUser || student.email === userEmail;
              const tier = getTierBadge(student.total_score);

              return (
                <div
                  key={student.id || index}
                  className={`p-4 sm:p-5 flex items-center justify-between transition ${
                    isCurrentUser 
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-l-4 border-indigo-500' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    
                    {/* Rank Badge */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shadow shrink-0 ${
                      rank === 1 ? 'bg-amber-400 text-slate-950 font-black' :
                      rank === 2 ? 'bg-slate-300 text-slate-900 font-black' :
                      rank === 3 ? 'bg-amber-700 text-white font-black' :
                      'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>

                    {/* Candidate Avatar */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(index)} p-0.5 shrink-0 hidden sm:block`}>
                      <div className="w-full h-full bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center font-black text-xs text-slate-900 dark:text-white">
                        {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    </div>

                    {/* Candidate Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                          <span>{student.name || 'Anonymous Student'}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-black uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border hidden md:inline-block ${tier.color}`}>
                          {tier.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Tests: <strong className="text-slate-800 dark:text-slate-200">{student.tests_completed}</strong> • AI Interviews: <strong className="text-slate-800 dark:text-slate-200">{student.interviews_completed}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Points & Score Visual */}
                  <div className="text-right flex items-center gap-3 sm:gap-6">
                    <div className="hidden sm:block text-right text-[11px] text-slate-500 dark:text-slate-400">
                      <div>Tests: <strong className="text-indigo-600 dark:text-indigo-300">{student.test_points || 0}</strong></div>
                      <div>Interviews: <strong className="text-purple-600 dark:text-purple-300">{student.interview_points || 0}</strong></div>
                    </div>
                    <div>
                      <span className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">{student.total_score}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Points</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}