import React from 'react';

export default function CampusEdgeLogo({ 
  size = 'md', 
  showText = true, 
  subtitle = null, 
  className = '', 
  onClick = null 
}) {
  const sizeMap = {
    xs: { iconSize: 24, textSize: 'text-base', subSize: 'text-[9px]', padding: 'p-1' },
    sm: { iconSize: 32, textSize: 'text-lg', subSize: 'text-[10px]', padding: 'p-1.5' },
    md: { iconSize: 40, textSize: 'text-2xl', subSize: 'text-xs', padding: 'p-2' },
    lg: { iconSize: 48, textSize: 'text-3xl', subSize: 'text-sm', padding: 'p-2.5' },
    xl: { iconSize: 58, textSize: 'text-4xl', subSize: 'text-base', padding: 'p-3' },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div 
      className={`inline-flex items-center gap-3 select-none group ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Dynamic Geometric Gradient Brand Icon */}
      <div 
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 shadow-lg shadow-indigo-600/25 group-hover:border-indigo-400 group-hover:shadow-indigo-500/40 transition-all duration-300 transform group-hover:scale-105"
        style={{ width: current.iconSize + 8, height: current.iconSize + 8 }}
      >
        {/* Ambient Subtle Pulse Glow behind logo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 rounded-2xl blur-xs pointer-events-none group-hover:opacity-100 opacity-60 transition duration-300"></div>

        <svg 
          width={current.iconSize} 
          height={current.iconSize} 
          viewBox="0 0 44 44" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 group-hover:rotate-6"
        >
          <defs>
            <linearGradient id="ceGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="ceGradAccent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="ceGradGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Graduation Cap Apex / Tech Diamond Peak */}
          <path 
            d="M22 6L37 14L22 22L7 14L22 6Z" 
            fill="url(#ceGradPrimary)" 
            stroke="#c7d2fe" 
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Forward Speed Edge Chevron / Career Velocity Prism */}
          <path 
            d="M37 17.5L37 25.5C37 26.8 36.2 28 35 28.6L22 35L9 28.6C7.8 28 7 26.8 7 25.5L7 17.5L22 25.5L37 17.5Z" 
            fill="url(#ceGradAccent)" 
            opacity="0.9"
          />

          {/* Dynamic Inner Light Blade (Edge) */}
          <path 
            d="M22 10L32 15.5L22 21L12 15.5L22 10Z" 
            fill="#ffffff" 
            opacity="0.4"
          />

          {/* Central AI Vertex Spark */}
          <circle cx="22" cy="22" r="2.5" fill="url(#ceGradGlow)" />
          <circle cx="22" cy="22" r="1" fill="#ffffff" />

          {/* Tassel / Circuit Accent Node */}
          <path 
            d="M37 14L39 18V24" 
            stroke="#fbbf24" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <circle cx="39" cy="24.5" r="1.5" fill="#fbbf24" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-black tracking-tight flex items-center gap-1.5 ${current.textSize}`}>
            <span className="text-slate-950 dark:text-white font-black">Campus</span>
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black">
              Edge
            </span>
          </div>
          {subtitle && (
            <span className={`font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 -mt-0.5 truncate max-w-[130px] sm:max-w-none ${current.subSize}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
