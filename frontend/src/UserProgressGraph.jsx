import React, { useState, useMemo } from 'react';

// Domain Taxonomy & Visual Theme Definitions
const DOMAIN_DEFINITIONS = [
  {
    id: 'web',
    name: 'Web & Frontend',
    icon: '🌐',
    color: 'from-orange-500 to-rose-500',
    border: 'border-orange-500/30',
    badge: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30',
    keywords: ['html', 'css', 'javascript', 'react', 'frontend', 'web', 'ui', 'tailwind']
  },
  {
    id: 'programming',
    name: 'Programming Languages',
    icon: '💻',
    color: 'from-indigo-500 to-blue-600',
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    keywords: ['python', 'java', 'c++', 'cpp', 'c language', 'c#', 'golang', 'rust', 'ruby', 'kotlin', 'swift']
  },
  {
    id: 'systems_db',
    name: 'Databases & Core CS',
    icon: '🗄️',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    keywords: ['database', 'sql', 'dbms', 'operating', 'os', 'network', 'data structure', 'dsa', 'algorithm', 'oop', 'system design', 'architecture']
  },
  {
    id: 'cloud_ai',
    name: 'Cloud, AI & Security',
    icon: '🤖',
    color: 'from-purple-500 to-fuchsia-600',
    border: 'border-purple-500/30',
    badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
    keywords: ['cloud', 'devops', 'machine learning', 'ai', 'cyber security', 'security', 'docker', 'kubernetes', 'backend', 'fastapi']
  },
  {
    id: 'aptitude',
    name: 'Aptitude & Soft Skills',
    icon: '🧠',
    color: 'from-amber-500 to-orange-600',
    border: 'border-amber-500/30',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    keywords: ['aptitude', 'reasoning', 'logical', 'verbal', 'quantitative', 'math', 'english', 'hr']
  },
  {
    id: 'other',
    name: 'General & Others',
    icon: '✨',
    color: 'from-slate-500 to-slate-700',
    border: 'border-slate-500/30',
    badge: 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    keywords: []
  }
];

// Helper to determine Domain from subject name
const detectDomain = (cleanName = '') => {
  const n = cleanName.toLowerCase();
  for (const domain of DOMAIN_DEFINITIONS) {
    if (domain.keywords.some(kw => n.includes(kw))) {
      return domain;
    }
  }
  return DOMAIN_DEFINITIONS[DOMAIN_DEFINITIONS.length - 1]; // 'other'
};

// Subject Icon & Brand Meta
const getSubjectMeta = (cleanName = '') => {
  const n = cleanName.toLowerCase();
  if (n.includes('html')) return { icon: '🌐', shortName: 'HTML' };
  if (n.includes('react')) return { icon: '⚛️', shortName: cleanName };
  if (n.includes('javascript') || n === 'js') return { icon: '🟨', shortName: 'JavaScript' };
  if (n.includes('python')) return { icon: '🐍', shortName: cleanName };
  if (n.includes('java') && !n.includes('script')) return { icon: '☕', shortName: cleanName };
  if (n.includes('c++') || n.includes('cpp')) return { icon: '⚡', shortName: cleanName };
  if (n.includes('sql') || n.includes('database') || n.includes('dbms')) return { icon: '🗄️', shortName: cleanName };
  if (n.includes('network')) return { icon: '🌐', shortName: cleanName };
  if (n.includes('operating') || n === 'os') return { icon: '💻', shortName: cleanName };
  if (n.includes('data structure') || n.includes('dsa') || n.includes('algorithm')) return { icon: '⚡', shortName: cleanName };
  if (n.includes('aptitude') || n.includes('reasoning')) return { icon: '🧠', shortName: cleanName };
  if (n.includes('cloud') || n.includes('devops')) return { icon: '☁️', shortName: cleanName };
  if (n.includes('machine learning') || n.includes('ai')) return { icon: '🤖', shortName: cleanName };
  if (n.includes('security')) return { icon: '🛡️', shortName: cleanName };
  if (n.includes('design pattern') || n.includes('oop')) return { icon: '📐', shortName: cleanName };
  return { icon: '🎯', shortName: cleanName };
};

export default function UserProgressGraph({
  student,
  testRecords = [],
  interviewRecords = [],
  codingRecords = [],
  onInspectTest,
  onInspectCode,
  onInspectInterview
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Category & Filter Controls
  const [selectedDomain, setSelectedDomain] = useState('all'); // 'all' or domain.id
  const [modeFilter, setModeFilter] = useState('combined'); // 'combined' | 'mock_only' | 'practice_only' | 'split'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score_desc'); // 'score_desc' | 'score_asc' | 'attempts_desc' | 'name_asc'
  const [viewLayout, setViewLayout] = useState('category_grouped'); // 'category_grouped' | 'grid'

  // 1. Process Mock Test Trajectory (Chronological order)
  const sortedTests = useMemo(() => {
    return [...testRecords].sort((a, b) => {
      const dateA = new Date(a.created_at || a.test_date || 0);
      const dateB = new Date(b.created_at || b.test_date || 0);
      return dateA - dateB;
    });
  }, [testRecords]);

  // 2. Compute Category Mastery Breakdown with Domain Classification & Smart Normalization
  const { normalizedSubjects, domainGroupedList, domainCounts } = useMemo(() => {
    const rawMap = new Map();

    testRecords.forEach(rec => {
      const rawCategory = rec.category || 'General';
      const isPractice = rawCategory.toLowerCase().includes('(practice)') || rec.mode === 'practice' || rec.test_type === 'practice';
      const cleanSubjectName = rawCategory.replace(/\s*\(\s*Practice\s*\)\s*/i, '').trim() || 'General';
      const pct = parseFloat(rec.percentage) || 0;

      // Grouping key depends on modeFilter
      const groupKey = modeFilter === 'split' ? rawCategory : cleanSubjectName;

      if (!rawMap.has(groupKey)) {
        rawMap.set(groupKey, {
          subjectName: groupKey,
          cleanName: cleanSubjectName,
          totalScoreSum: 0,
          totalCount: 0,
          highestScore: 0,
          mockScoreSum: 0,
          mockCount: 0,
          mockHighest: 0,
          practiceScoreSum: 0,
          practiceCount: 0,
          practiceHighest: 0,
          domain: detectDomain(cleanSubjectName),
          meta: getSubjectMeta(cleanSubjectName),
          isPracticeOnly: isPractice && modeFilter === 'split'
        });
      }

      const item = rawMap.get(groupKey);
      item.totalScoreSum += pct;
      item.totalCount += 1;
      if (pct > item.highestScore) item.highestScore = pct;

      if (isPractice) {
        item.practiceScoreSum += pct;
        item.practiceCount += 1;
        if (pct > item.practiceHighest) item.practiceHighest = pct;
      } else {
        item.mockScoreSum += pct;
        item.mockCount += 1;
        if (pct > item.mockHighest) item.mockHighest = pct;
      }
    });

    let list = [];
    rawMap.forEach((val) => {
      // Filter out if user selected mock_only or practice_only
      if (modeFilter === 'mock_only' && val.mockCount === 0) return;
      if (modeFilter === 'practice_only' && val.practiceCount === 0) return;

      const effectiveCount = modeFilter === 'mock_only' ? val.mockCount : modeFilter === 'practice_only' ? val.practiceCount : val.totalCount;
      const effectiveScoreSum = modeFilter === 'mock_only' ? val.mockScoreSum : modeFilter === 'practice_only' ? val.practiceScoreSum : val.totalScoreSum;
      const effectiveHighest = modeFilter === 'mock_only' ? val.mockHighest : modeFilter === 'practice_only' ? val.practiceHighest : val.highestScore;

      list.push({
        ...val,
        attempts: effectiveCount,
        avgPercentage: effectiveCount > 0 ? Math.round(effectiveScoreSum / effectiveCount) : 0,
        highestPercentage: Math.round(effectiveHighest),
        mockAvg: val.mockCount > 0 ? Math.round(val.mockScoreSum / val.mockCount) : null,
        practiceAvg: val.practiceCount > 0 ? Math.round(val.practiceScoreSum / val.practiceCount) : null
      });
    });

    // Compute domain counts before filtering
    const counts = { all: list.length };
    DOMAIN_DEFINITIONS.forEach(d => { counts[d.id] = 0; });
    list.forEach(item => {
      if (counts[item.domain.id] !== undefined) {
        counts[item.domain.id] += 1;
      }
    });

    // Apply Domain filter
    if (selectedDomain !== 'all') {
      list = list.filter(item => item.domain.id === selectedDomain);
    }

    // Apply Search Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.subjectName.toLowerCase().includes(q) || 
        item.domain.name.toLowerCase().includes(q)
      );
    }

    // Apply Sorting
    list.sort((a, b) => {
      if (sortBy === 'score_desc') return b.avgPercentage - a.avgPercentage;
      if (sortBy === 'score_asc') return a.avgPercentage - b.avgPercentage;
      if (sortBy === 'attempts_desc') return b.attempts - a.attempts;
      if (sortBy === 'name_asc') return a.subjectName.localeCompare(b.subjectName);
      return 0;
    });

    // Group items by Domain for Category-Wise Grouped View
    const grouped = [];
    DOMAIN_DEFINITIONS.forEach(domain => {
      const domainSubjects = list.filter(item => item.domain.id === domain.id);
      if (domainSubjects.length > 0) {
        const domainAvg = Math.round(
          domainSubjects.reduce((acc, curr) => acc + curr.avgPercentage, 0) / domainSubjects.length
        );
        grouped.push({
          domain,
          subjects: domainSubjects,
          domainAvg,
          totalAttempts: domainSubjects.reduce((acc, curr) => acc + curr.attempts, 0)
        });
      }
    });

    return {
      normalizedSubjects: list,
      domainGroupedList: grouped,
      domainCounts: counts
    };
  }, [testRecords, modeFilter, selectedDomain, searchQuery, sortBy]);

  // 3. Compute KPI Metrics
  const totalTests = testRecords.length;
  const avgTestScore = totalTests > 0
    ? Math.round(testRecords.reduce((acc, curr) => acc + (parseFloat(curr.percentage) || 0), 0) / totalTests)
    : 0;

  const highestTestScore = totalTests > 0
    ? Math.max(...testRecords.map(t => parseFloat(t.percentage) || 0))
    : 0;

  // Growth Delta (first test vs latest test)
  const growthDelta = sortedTests.length >= 2
    ? Math.round((parseFloat(sortedTests[sortedTests.length - 1].percentage) || 0) - (parseFloat(sortedTests[0].percentage) || 0))
    : 0;

  const totalCoding = codingRecords.length;
  const acceptedCoding = codingRecords.filter(c => c.status === 'Accepted').length;
  const codingSuccessRate = totalCoding > 0 ? Math.round((acceptedCoding / totalCoding) * 100) : 0;

  const totalInterviews = interviewRecords.length;
  const avgInterviewScore = totalInterviews > 0
    ? Math.round(interviewRecords.reduce((acc, curr) => acc + (parseFloat(curr.score) || 0), 0) / totalInterviews)
    : 0;

  const atsScore = student?.latestAts ? student.latestAts.score : (student?.atsScore || 0);

  // Placement Readiness Index (weighted score: 40% Tests, 25% Coding, 20% Interview, 15% ATS)
  const readinessIndex = useMemo(() => {
    let weightSum = 0;
    let scoreSum = 0;

    if (totalTests > 0) {
      scoreSum += avgTestScore * 0.40;
      weightSum += 0.40;
    }
    if (totalCoding > 0) {
      scoreSum += codingSuccessRate * 0.25;
      weightSum += 0.25;
    }
    if (totalInterviews > 0) {
      scoreSum += (avgInterviewScore > 100 ? (avgInterviewScore / 10) : avgInterviewScore) * 0.20;
      weightSum += 0.20;
    }
    if (atsScore > 0) {
      scoreSum += atsScore * 0.15;
      weightSum += 0.15;
    }

    if (weightSum === 0) return 0;
    return Math.min(100, Math.round(scoreSum / weightSum));
  }, [avgTestScore, totalTests, codingSuccessRate, totalCoding, avgInterviewScore, totalInterviews, atsScore]);

  // SVG Line Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  // Coordinate mapping for SVG test trajectory
  const points = useMemo(() => {
    if (sortedTests.length === 0) return [];
    if (sortedTests.length === 1) {
      const pct = parseFloat(sortedTests[0].percentage) || 0;
      const y = svgHeight - paddingY - (pct / 100) * (svgHeight - paddingY * 2);
      return [{ x: svgWidth / 2, y, record: sortedTests[0], index: 0 }];
    }

    const graphW = svgWidth - paddingX * 2;
    const graphH = svgHeight - paddingY * 2;

    return sortedTests.map((t, idx) => {
      const pct = Math.min(100, Math.max(0, parseFloat(t.percentage) || 0));
      const x = paddingX + (idx / (sortedTests.length - 1)) * graphW;
      const y = svgHeight - paddingY - (pct / 100) * graphH;
      return { x, y, record: t, index: idx };
    });
  }, [sortedTests, svgWidth, svgHeight, paddingX, paddingY]);

  // Construct SVG Path string
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
    return points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
  }, [points]);

  // Construct Area Under Curve Path string
  const areaD = useMemo(() => {
    if (points.length < 2) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = svgHeight - paddingY;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [points, pathD, svgHeight, paddingY]);

  // Helper for competency styling
  const getCompetencyBadge = (avgPct) => {
    if (avgPct >= 75) {
      return {
        label: '🌟 Mastered',
        badge: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
        bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        glow: 'shadow-emerald-500/20'
      };
    }
    if (avgPct >= 60) {
      return {
        label: '⚡ Proficient',
        badge: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40',
        bar: 'bg-gradient-to-r from-indigo-500 to-blue-500',
        glow: 'shadow-indigo-500/20'
      };
    }
    if (avgPct >= 45) {
      return {
        label: '🎯 Developing',
        badge: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
        bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
        glow: 'shadow-amber-500/20'
      };
    }
    return {
      label: '🔄 Needs Practice',
      badge: 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40',
      bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
      glow: 'shadow-rose-500/20'
    };
  };

  // Render Subject Mastery Card Component
  const renderSubjectCard = (cat) => {
    const comp = getCompetencyBadge(cat.avgPercentage);

    return (
      <div 
        key={cat.subjectName}
        className="glass-card-hover p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 transition-all duration-200"
      >
        {/* Top Header: Icon, Subject Title, and Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-lg shrink-0 shadow-xs">
              {cat.meta.icon}
            </div>
            <div className="min-w-0">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate" title={cat.subjectName}>
                {cat.subjectName}
              </h5>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cat.domain.badge}`}>
                  {cat.domain.name}
                </span>
              </div>
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${comp.badge}`}>
            {comp.label}
          </span>
        </div>

        {/* Middle: Progress Bar & Numeric Stats */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Competency Level
            </span>
            <span className="font-black text-sm text-slate-900 dark:text-white">
              {cat.avgPercentage}%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/40">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${comp.bar}`}
              style={{ width: `${Math.max(6, cat.avgPercentage)}%` }}
            ></div>
          </div>
        </div>

        {/* Bottom Details Row: Attempts Pill & Peak Score */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {cat.attempts} total test{cat.attempts > 1 ? 's' : ''}
            </span>
            {cat.mockCount > 0 && cat.practiceCount > 0 && modeFilter === 'combined' && (
              <span className="text-[9px] text-slate-500">
                ({cat.mockCount} mock • {cat.practiceCount} practice)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0 font-medium">
            <span>Peak:</span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{cat.highestPercentage}%</strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
      
      {/* Top Header & Readiness Indicator */}
      <div className="bg-gradient-to-r from-indigo-900/20 via-purple-900/10 to-transparent p-5 rounded-3xl border border-indigo-200 dark:border-indigo-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Candidate Performance & Growth Trajectory
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Real-time analytics tracking mock test scores, coding submissions, and interview milestones for <strong className="text-indigo-600 dark:text-indigo-400">{student?.name || student?.email}</strong>.
          </p>
        </div>

        {/* Readiness Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Placement Readiness</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {readinessIndex >= 75 ? '🌟 High Placement Ready' : readinessIndex >= 50 ? '⚡ Good Progress' : '🌱 Building Foundations'}
            </span>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-inner ${
            readinessIndex >= 75 ? 'bg-gradient-to-tr from-emerald-600 to-teal-500' :
            readinessIndex >= 50 ? 'bg-gradient-to-tr from-indigo-600 to-purple-600' :
            'bg-gradient-to-tr from-amber-600 to-orange-500'
          }`}>
            {readinessIndex}%
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Metric 1: Mock Test Average */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
            <span>Mock Test Avg</span>
            <span>📝</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{avgTestScore}%</span>
            {growthDelta !== 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                growthDelta > 0 
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' 
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
              }`}>
                {growthDelta > 0 ? `+${growthDelta}%` : `${growthDelta}%`}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {totalTests} Tests • Peak: {highestTestScore}%
          </p>
        </div>

        {/* Metric 2: Coding Arena */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
            <span>Coding Solves</span>
            <span>💻</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{acceptedCoding}</span>
            <span className="text-[10px] text-slate-500 font-bold">/ {totalCoding} tried</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {codingSuccessRate}% solve accuracy
          </p>
        </div>

        {/* Metric 3: AI Interview Score */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
            <span>AI Mock Rounds</span>
            <span>🎙️</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {totalInterviews}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">Completed</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Avg Score: {avgInterviewScore} pts
          </p>
        </div>

        {/* Metric 4: Resume ATS */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase">
            <span>Resume ATS</span>
            <span>📄</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${atsScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {atsScore ? `${atsScore}/100` : 'No Scan'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {atsScore >= 70 ? 'Interview Ready' : 'Optimization Recommended'}
          </p>
        </div>

      </div>

      {/* Main Interactive Score Trajectory Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>📊</span> Score Trajectory Over Time
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chronological progress across mock test attempts. Hover over points to view detailed results.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-0.5 bg-emerald-500"></span> 70% Target Benchmark
            </span>
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Actual Score
            </span>
          </div>
        </div>

        {sortedTests.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center space-y-2">
            <span className="text-3xl">📊</span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No mock tests attempted yet.</p>
            <p className="text-[11px] text-slate-500">As the student takes placement tests, their chronological score curve and learning velocity will render here.</p>
          </div>
        ) : (
          <div className="relative overflow-hidden">
            {/* SVG Visual Graph */}
            <div className="w-full overflow-x-auto">
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                className="w-full h-56 select-none"
              >
                <defs>
                  {/* Linear Gradient for Area fill */}
                  <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Gradient for Benchmark */}
                  <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines (0%, 25%, 50%, 75%, 100%) */}
                {[0, 25, 50, 75, 100].map(pct => {
                  const y = svgHeight - paddingY - (pct / 100) * (svgHeight - paddingY * 2);
                  return (
                    <g key={pct}>
                      <line 
                        x1={paddingX} 
                        y1={y} 
                        x2={svgWidth - paddingX} 
                        y2={y} 
                        stroke="currentColor" 
                        className="text-slate-200 dark:text-slate-800" 
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text 
                        x={paddingX - 8} 
                        y={y + 3} 
                        textAnchor="end" 
                        className="fill-slate-400 dark:fill-slate-600 text-[9px] font-mono font-bold"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* 70% Placement Target Line */}
                {(() => {
                  const targetY = svgHeight - paddingY - (70 / 100) * (svgHeight - paddingY * 2);
                  return (
                    <line 
                      x1={paddingX} 
                      y1={targetY} 
                      x2={svgWidth - paddingX} 
                      y2={targetY} 
                      stroke="#10b981" 
                      strokeWidth="1.5" 
                      strokeDasharray="3 3"
                    />
                  );
                })()}

                {/* Area Gradient Under Curve */}
                {areaD && (
                  <path d={areaD} fill="url(#scoreAreaGradient)" />
                )}

                {/* Main Curve Line */}
                {pathD && (
                  <path 
                    d={pathD} 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                )}

                {/* Interactive Data Points */}
                {points.map((pt) => {
                  const isHovered = hoveredPoint?.index === pt.index;
                  const isPass = (parseFloat(pt.record.percentage) || 0) >= 70;

                  return (
                    <g 
                      key={pt.index} 
                      className="cursor-pointer transition-transform duration-200"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => onInspectTest && onInspectTest(pt.record)}
                    >
                      {/* Pulse Circle when hovered */}
                      {isHovered && (
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r="10" 
                          fill="#6366f1" 
                          opacity="0.25" 
                        />
                      )}

                      {/* Main Node */}
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r={isHovered ? "6" : "4.5"} 
                        fill={isPass ? "#10b981" : "#6366f1"} 
                        stroke="#ffffff" 
                        strokeWidth="2" 
                        className="shadow-md"
                      />

                      {/* Date Label on X Axis */}
                      <text 
                        x={pt.x} 
                        y={svgHeight - 10} 
                        textAnchor="middle" 
                        className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold"
                      >
                        {pt.record.test_date ? pt.record.test_date.slice(0, 5) : `T${pt.index + 1}`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div 
                className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-2xl border border-slate-700 pointer-events-none z-10 flex items-center gap-3 animate-fade-in"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xs">
                  {hoveredPoint.record.percentage}%
                </div>
                <div>
                  <div className="font-bold text-slate-100">
                    {hoveredPoint.record.category} Assessment
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Score: {hoveredPoint.record.score}/{hoveredPoint.record.total} • {hoveredPoint.record.test_date}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Category Proficiency Breakdown: Category-Wise Organization & Compact Grid */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-full mb-1.5">
              <span>🎯</span> Domain Competency Matrix
            </div>
            <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              Category Mastery & Topic Breakdown
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Organized by academic domains, merging practice drills and formal mock assessments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* View Mode Toggle: Grouped by Domain vs Unified Grid */}
            <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewLayout('category_grouped')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewLayout === 'category_grouped'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>📂</span> By Category
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewLayout === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>🔲</span> Grid Cards
              </button>
            </div>

            {/* Mode Filter Dropdown/Pills */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="combined">✨ Unified (Mock + Practice)</option>
              <option value="mock_only">🎯 Mock Tests Only</option>
              <option value="practice_only">⚡ Practice Mode Only</option>
              <option value="split">🔀 Raw Breakdown (Split)</option>
            </select>
          </div>
        </div>

        {/* Domain Category Filter Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-b border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setSelectedDomain('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer border flex items-center gap-1.5 ${
              selectedDomain === 'all'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🌐</span> All Domains ({domainCounts.all || 0})
          </button>

          {DOMAIN_DEFINITIONS.map(domain => {
            const count = domainCounts[domain.id] || 0;
            if (count === 0 && selectedDomain !== domain.id) return null; // hide empty tabs

            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => setSelectedDomain(domain.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer border flex items-center gap-1.5 ${
                  selectedDomain === domain.id
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{domain.icon}</span>
                <span>{domain.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedDomain === domain.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search topic or skill (e.g. Python, SQL, HTML...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px] font-bold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="score_desc">🏆 Highest Score</option>
              <option value="score_asc">🎯 Needs Focus</option>
              <option value="attempts_desc">🔥 Most Attempted</option>
              <option value="name_asc">🔤 Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Content Body: Empty State / Grouped by Category / Compact Grid */}
        {normalizedSubjects.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
            <span className="text-3xl">🎯</span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No matching subject evaluations found.
            </p>
            <p className="text-[11px] text-slate-500">
              {searchQuery ? `No subjects matched "${searchQuery}". Try clearing your search.` : "Take mock tests or practice sets to build your domain mastery profile."}
            </p>
          </div>
        ) : viewLayout === 'category_grouped' ? (
          /* CATEGORY-WISE GROUPED ACCORDION / SECTIONS */
          <div className="space-y-6">
            {domainGroupedList.map(({ domain, subjects, domainAvg, totalAttempts }) => (
              <div 
                key={domain.id} 
                className="p-5 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-xs"
              >
                {/* Domain Category Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                      {domain.icon}
                    </span>
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        {domain.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {subjects.length} evaluated topic{subjects.length > 1 ? 's' : ''} &bull; {totalAttempts} total attempts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Category Avg:</span>
                    <span className={`text-xs font-black ${
                      domainAvg >= 75 ? 'text-emerald-700 dark:text-emerald-400' :
                      domainAvg >= 60 ? 'text-indigo-700 dark:text-indigo-400' :
                      domainAvg >= 45 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                    }`}>
                      {domainAvg}%
                    </span>
                  </div>
                </div>

                {/* Responsive 2-column or 3-column Grid for Cards within Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {subjects.map(cat => renderSubjectCard(cat))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* COMPACT MULTI-COLUMN GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {normalizedSubjects.map(cat => renderSubjectCard(cat))}
          </div>
        )}

      </div>

    </div>
  );
}
