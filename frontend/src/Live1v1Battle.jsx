import { streakManager } from './streakManager';
import React, { useState, useEffect } from 'react';
import { triggerConfetti } from './confetti';
import { playSound } from './soundEffects';

const MOCK_OPPONENTS = [
  { name: 'Aarav Sharma', college: 'IIT Bombay', avatar: '👨‍💻', rating: 1420 },
  { name: 'Priya Patel', college: 'BITS Pilani', avatar: '👩‍💻', rating: 1390 },
  { name: 'Rohan Iyer', college: 'NIT Trichy', avatar: '🧑‍💻', rating: 1460 },
  { name: 'Ananya Gupta', college: 'DTU Delhi', avatar: '👩‍🔬', rating: 1410 }
];

const BATTLE_QUESTIONS = [
  {
    id: 1,
    topic: "System Design & Caching",
    q: "Which cache invalidation policy removes the item that was least recently accessed when capacity is reached?",
    options: ["FIFO (First In First Out)", "LRU (Least Recently Used)", "LFU (Least Frequently Used)", "Random Eviction"],
    ans: 1,
    time: 15
  },
  {
    id: 2,
    topic: "Operating Systems",
    q: "Which condition is NOT one of the 4 necessary Coffman conditions for deadlock to occur?",
    options: ["Mutual Exclusion", "Hold and Wait", "Preemption Allowed", "Circular Wait"],
    ans: 2,
    time: 15
  },
  {
    id: 3,
    topic: "Databases & SQL",
    q: "Which transaction isolation level prevents Dirty Reads but allows Non-Repeatable Reads?",
    options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
    ans: 1,
    time: 15
  },
  {
    id: 4,
    topic: "Data Structures",
    q: "What is the worst-case time complexity of searching in a standard Binary Search Tree of N elements?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    ans: 2,
    time: 15
  },
  {
    id: 5,
    topic: "Computer Networks",
    q: "In the TCP 3-way handshake, what is the sequence of flag packets sent between client and server?",
    options: ["SYN -> ACK -> SYN", "SYN -> SYN-ACK -> ACK", "ACK -> SYN -> ACK", "SYN -> FIN -> ACK"],
    ans: 1,
    time: 15
  }
];

export default function Live1v1Battle({ userName = "You", onBack }) {
  const [gameState, setGameState] = useState('matchmaking'); // matchmaking, battling, gameover
  const [opponent, setOpponent] = useState(MOCK_OPPONENTS[0]);
  const [matchmakingTime, setMatchmakingTime] = useState(3);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timer, setTimer] = useState(15);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);

  // Matchmaking effect
  useEffect(() => {
    if (gameState === 'matchmaking') {
      const chosen = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
      setOpponent(chosen);
      const interval = setInterval(() => {
        setMatchmakingTime(t => {
          if (t <= 1) {
            clearInterval(interval);
            setGameState('battling');
            playSound('success');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Battle question timer
  useEffect(() => {
    if (gameState !== 'battling') return;

    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          handleNextQuestion(selectedOpt);
          return 15;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentIdx, selectedOpt]);

  const handleNextQuestion = (userChoice) => {
    const q = BATTLE_QUESTIONS[currentIdx];
    const isCorrect = userChoice === q.ans;
    
    // Calculate simulated opponent answer with ~80% accuracy
    const oppCorrect = Math.random() < 0.78;
    
    const newUserScore = isCorrect ? userScore + Math.max(50, timer * 10) : userScore;
    const newOppScore = oppCorrect ? opponentScore + Math.floor(Math.random() * 40 + 70) : opponentScore;

    if (isCorrect) playSound('correct');
    else if (userChoice !== null) playSound('wrong');

    setUserScore(newUserScore);
    setOpponentScore(newOppScore);
    setUserAnswers(prev => [...prev, { qId: q.id, choice: userChoice, isCorrect }]);
    setSelectedOpt(null);

    if (currentIdx + 1 < BATTLE_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
      setTimer(15);
    } else {
      setGameState('gameover');
      streakManager.recordActivity({
        type: 'duel',
        xp: newUserScore >= newOppScore ? 120 : 60,
        coins: newUserScore >= newOppScore ? 25 : 10,
        title: newUserScore >= newOppScore ? 'Won 1v1 Placement Speed Duel' : 'Completed 1v1 Placement Speed Duel'
      });
      if (newUserScore >= newOppScore) {
        playSound('victory');
        triggerConfetti(3000);
      }
    }
  };

  const handleSelectOption = (idx) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    playSound('click');
    setTimeout(() => {
      handleNextQuestion(idx);
    }, 450);
  };

  const restartBattle = () => {
    setGameState('matchmaking');
    setMatchmakingTime(3);
    setCurrentIdx(0);
    setTimer(15);
    setUserScore(0);
    setOpponentScore(0);
    setUserAnswers([]);
    setSelectedOpt(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-2 sm:p-4 text-slate-900 dark:text-white transition-colors">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          ← Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Live Duel Server #104</span>
        </div>
      </div>

      {gameState === 'matchmaking' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-indigo-500/30 shadow-xl dark:shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-indigo-50 dark:bg-indigo-600/20 border-2 border-indigo-500 dark:border-indigo-400 flex items-center justify-center text-4xl animate-bounce">
            ⚔️
          </div>
          <h2 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">Finding Live Peer Competitor...</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
            Matching you with students from top engineering colleges for a 5-round rapid placement duel.
          </p>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-400/40 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-sm">
            <span>Searching candidate pool ({matchmakingTime}s)...</span>
          </div>
        </div>
      )}

      {gameState === 'battling' && (
        <div className="space-y-4">
          {/* Live Duel HUD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-indigo-500/30 shadow-lg dark:shadow-2xl">
            <div className="grid grid-cols-3 items-center text-center gap-2 mb-4">
              {/* You */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-md mb-1">
                  🎓
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white">{userName}</p>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">{userScore} pts</p>
              </div>

              {/* Timer vs Badge */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-950 border-4 border-amber-500 flex items-center justify-center text-xl font-mono font-black text-amber-600 dark:text-amber-400 shadow-md">
                  {timer}
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">Round {currentIdx + 1} of {BATTLE_QUESTIONS.length}</span>
              </div>

              {/* Opponent */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shadow-md mb-1">
                  {opponent.avatar}
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white">{opponent.name}</p>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{opponentScore} pts</p>
              </div>
            </div>

            {/* Score Comparison Tug-of-war */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-700">
              <div 
                className="bg-indigo-500 transition-all duration-500"
                style={{ width: `${(userScore + opponentScore === 0) ? 50 : Math.max(10, Math.min(90, (userScore / (userScore + opponentScore || 1)) * 100))}%` }}
              />
              <div 
                className="bg-rose-500 transition-all duration-500 flex-1"
              />
            </div>
          </div>

          {/* Question Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {BATTLE_QUESTIONS[currentIdx].topic}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Speed Bonus: +{timer * 10} XP</span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-5 leading-relaxed">
              {BATTLE_QUESTIONS[currentIdx].q}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BATTLE_QUESTIONS[currentIdx].options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                return (
                  <button
                    key={idx}
                    disabled={selectedOpt !== null}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-indigo-500/30 shadow-xl dark:shadow-2xl text-center">
          <div className="text-5xl mb-3">
            {userScore > opponentScore ? '🏆' : userScore === opponentScore ? '🤝' : '🥈'}
          </div>
          <h2 className="text-2xl font-black mb-1 text-slate-900 dark:text-white">
            {userScore > opponentScore ? 'VICTORY!' : userScore === opponentScore ? 'TIED MATCH!' : 'GOOD EFFORT!'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
            {userScore > opponentScore 
              ? `You outperformed ${opponent.name} from ${opponent.college} in rapid problem-solving!`
              : `${opponent.name} clinched the win. Review your concepts and rematch!`}
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 font-mono">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your Score</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{userScore}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Opponent</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{opponentScore}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={restartBattle}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-xs text-white shadow-lg transition cursor-pointer"
            >
              Play Another Duel ⚔️
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
