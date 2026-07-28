'use client';

import React from 'react';
import {
  Users,
  UserPlus,
  Circle,
  Target,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   INLINE ICON HELPERS (used inside row labels)
───────────────────────────────────────────── */
function IconVs() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--active-tier,#3B7DDB)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l6 6M14 14l6 6M20 4L4 20"/>
    </svg>
  );
}
function IconBars() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--active-tier,#3B7DDB)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function IconFeed() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--active-tier,#3B7DDB)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   MICRO SPARKLINE (tiny inline svg)
───────────────────────────────────────────── */
function Sparkline({ up = true }: { up?: boolean }) {
  const path = up
    ? 'M0,12 Q8,10 16,7 T32,3'
    : 'M0,3 Q8,6 16,9 T32,12';
  return (
    <svg width="32" height="14" viewBox="0 0 32 14" className="inline-block" style={{ verticalAlign: 'middle' }}>
      <path d={path} fill="none" stroke={up ? 'var(--active-tier,#3B7DDB)' : '#8A8A85'} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="32" cy={up ? 3 : 12} r="2" fill={up ? 'var(--active-tier,#3B7DDB)' : '#8A8A85'}/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   WATERMARK NUMERAL
───────────────────────────────────────────── */
function Watermark({ label, side = 'left' }: { label: string; side?: 'left' | 'right' }) {
  return (
    <div
      aria-hidden
      className="absolute top-[5%] font-mono select-none pointer-events-none z-0"
      style={{
        fontSize: 'min(360px, 34vw)',
        lineHeight: 0.85,
        WebkitTextStroke: '1.5px rgba(237,234,228,0.22)',
        color: 'transparent',
        [side === 'left' ? 'left' : 'right']: '-3%',
      }}
    >
      {label}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export function FeatureCards() {
  const tickerItems = [
    'AC —— WA —— TLE —— RE —— ONE RATING, EVERY JUDGE ——',
    'AC —— WA —— TLE —— RE —— ONE RATING, EVERY JUDGE ——',
    'AC —— WA —— TLE —— RE —— ONE RATING, EVERY JUDGE ——',
    'AC —— WA —— TLE —— RE —— ONE RATING, EVERY JUDGE ——',
  ];

  return (
    <div className="relative z-10 w-full bg-transparent text-[#EDEAE4] overflow-x-hidden">

      {/* ── GLOBAL STYLES ── */}
      <style jsx global>{`
        @keyframes marquee {
          from { transform: translateX(0%); }
          to   { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spinSlow 28s linear infinite; }
      `}</style>

      {/* ── MARQUEE TICKER ── */}
      <div className="w-full border-t border-b border-[#242426] py-3 overflow-hidden opacity-45 group">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          {tickerItems.concat(tickerItems).map((text, idx) => (
            <span key={idx} className="font-mono text-xs uppercase tracking-[0.2em] whitespace-nowrap px-8" style={{ color: '#8A8A85' }}>
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── LOW-POLY CRYSTAL (decorative, between Ch I / Ch II) ── */}
      <div className="absolute top-[24%] right-[4%] z-0 pointer-events-none opacity-35 animate-spin-slow">
        <svg width="140" height="140" viewBox="0 0 100 100" fill="none">
          <polygon points="50,5 90,30 50,50"  fill="var(--active-tier,#3B7DDB)" fillOpacity="0.45" stroke="#242426" strokeWidth="0.5"/>
          <polygon points="50,5 50,50 10,30"  fill="var(--active-tier,#3B7DDB)" fillOpacity="0.20" stroke="#242426" strokeWidth="0.5"/>
          <polygon points="90,30 95,70 50,50" fill="var(--active-tier,#3B7DDB)" fillOpacity="0.35" stroke="#242426" strokeWidth="0.5"/>
          <polygon points="95,70 50,95 50,50" fill="var(--active-tier,#3B7DDB)" fillOpacity="0.60" stroke="#242426" strokeWidth="0.5"/>
          <polygon points="50,95 5,70 50,50"  fill="var(--active-tier,#3B7DDB)" fillOpacity="0.25" stroke="#242426" strokeWidth="0.5"/>
          <polygon points="5,70 10,30 50,50"  fill="var(--active-tier,#3B7DDB)" fillOpacity="0.15" stroke="#242426" strokeWidth="0.5"/>
        </svg>
      </div>

      {/* ════════════════════════════════════════
          CHAPTER I — The Gap
         ════════════════════════════════════════ */}
      <section className="relative w-full border-b border-[#242426] py-24 overflow-hidden">
        <Watermark label="I" side="left" />
        <div className="mx-auto max-w-7xl px-8 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2.5fr] gap-12 items-start">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8A8A85] block">I · THE GAP</span>
            </div>
            <div className="p-6 md:p-8 rounded-sm" style={{ background: 'linear-gradient(90deg,rgba(10,11,13,0.88) 0%,rgba(10,11,13,0.45) 75%,transparent 100%)' }}>
              <h2 className="mb-8 tracking-tight text-[#EDEAE4]" style={{ fontSize:'clamp(2.5rem,5vw,4rem)', lineHeight:1.05 }}>
                <span className="font-bold">Two ratings.</span>{' '}
                <span className="font-light text-[#8A8A85]">Zero alignment.</span>
              </h2>
              <p className="text-base md:text-lg font-light leading-relaxed text-[#EDEAE4] mb-12 max-w-2xl">
                Your CF rating and your LeetCode rating have never spoken to each other. One shows how you perform under pressure. The other shows how deep you can think. Neither gives you the full picture.
              </p>
              <div className="flex items-center gap-12 pt-6">
                <div>
                  <div className="font-mono text-4xl md:text-5xl font-bold tracking-tight text-[#EDEAE4]">1,847</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8A8A85] mt-2">Codeforces Rating</div>
                </div>
                <div className="h-16 w-[1px] bg-[#242426]" />
                <div>
                  <div className="font-mono text-4xl md:text-5xl font-bold tracking-tight text-[#EDEAE4]">2,134</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8A8A85] mt-2">LeetCode Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CHAPTER II — What Arc Actually Does
         ════════════════════════════════════════ */}
      <section className="relative w-full border-b border-[#242426] py-28 overflow-hidden">
        <Watermark label="II" side="left" />
        <div className="mx-auto max-w-7xl px-8 lg:px-16 relative z-10">
          <div className="mb-12">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8A8A85] block mb-3">
              II · WHAT ARC ACTUALLY DOES
            </span>
            <h2 className="font-bold tracking-tight text-[#EDEAE4]" style={{ fontSize:'clamp(2.5rem,5vw,4rem)', lineHeight:1.05 }}>
              What Arc actually does.
            </h2>
          </div>

          {/* Single shared panel */}
          <div className="border border-[#242426] rounded-[4px] overflow-hidden" style={{ background:'linear-gradient(90deg,rgba(10,11,13,0.92) 0%,rgba(10,11,13,0.5) 80%,transparent 100%)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#242426] p-8 md:p-12 gap-8 md:gap-0">
              {/* Left: What you get */}
              <div className="md:pr-12">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#8A8A85] mb-8">What you get</h3>
                <ul className="space-y-5 font-mono text-sm text-[#EDEAE4]">
                  {[
                    'One handle, one true rating',
                    'Real topic weaknesses, not guesses',
                    'Daily practice, mapped to your actual gaps',
                    'See exactly where friends passed you',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--active-tier,#3B7DDB)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Right: What you don't */}
              <div className="pt-8 md:pt-0 md:pl-12">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#8A8A85] mb-8 opacity-60">What you don&apos;t</h3>
                <ul className="space-y-5 font-mono text-sm text-[#8A8A85] opacity-60">
                  {[
                    'Another dashboard to check',
                    'Generic problem recommendations',
                    'A static score with no context',
                    'Comparing yourself in the dark',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CHAPTER III — Five Core Features
         ════════════════════════════════════════ */}
      <section id="features" className="relative w-full scroll-mt-28 border-b border-[#242426] py-28 overflow-hidden">
        <Watermark label="III" side="right" />
        <div className="mx-auto max-w-7xl px-8 lg:px-16 relative z-10">
          <div className="flex items-center justify-between mb-16">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8A8A85] block mb-3">
                III · FOUR CORE ENGINE FEATURES
              </span>
              <h2 className="font-normal tracking-tight text-[#EDEAE4]" style={{ fontSize:'clamp(2.5rem,5vw,4rem)', lineHeight:1.05 }}>
                The four things Arc <span className="font-bold">actually</span> does.
              </h2>
            </div>
            <div className="font-mono text-3xl md:text-5xl tracking-[0.3em] text-[#8A8A85] opacity-15 select-none hidden sm:block">
              01 02 03 04
            </div>
          </div>

          <div className="w-full space-y-0">

            {/* ─────────────────────────────────────────
                ROW 01 — Friends System (CENTERED, dark)
               ───────────────────────────────────────── */}
            <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
              <div className="md:col-span-5 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} stroke="var(--active-tier,#3B7DDB)" strokeWidth={1.5} />
                <span className="font-mono text-xs text-[#8A8A85]">01</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-[#EDEAE4] tracking-[-0.02em]">Friends System</h3>
              <p className="text-base text-[#8A8A85] leading-relaxed max-w-md">
                Connect with friends directly — no more hunting profile URLs across Codeforces and LeetCode. One search, instant connection, live comparison.
              </p>
              <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
                {['2 requests', '5 active', '1 leaderboard'].map((item) => (
                  <div key={item} className="border border-[#242426] bg-[#0A0B0D]/70 px-3 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A8A85]">{item}</span>
                  </div>
                ))}
              </div>
              </div>

              {/* Friends Widget */}
              <div className="md:col-span-7 w-full" style={{ background:'rgba(10,11,13,0.96)', border:'1px solid #1F1F22', borderRadius: 6, overflow:'hidden' }}>
                {/* Header bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#1F1F22]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8A8A85]">Friends — Arc Network</span>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-[#8A8A85]">
                    <UserPlus size={12} stroke="var(--active-tier,#3B7DDB)" />
                    <span style={{ color:'var(--active-tier,#3B7DDB)' }}>2 pending</span>
                  </div>
                </div>

                {/* Friend rows */}
                <div className="divide-y divide-[#1F1F22]">
                  {[
                    { name:'tourist',   cf:3840, lc:3400, online:true,  you:false },
                    { name:'You',       cf:1847, lc:2134, online:true,  you:true  },
                    { name:'nlogn',     cf:2104, lc:1980, online:false, you:false },
                    { name:'benq',      cf:3120, lc:2950, online:false, you:false },
                  ].map(({ name, cf, lc, online, you }) => (
                    <div
                      key={name}
                      className="flex items-center gap-4 px-5 py-3 font-mono text-xs"
                      style={you ? { color:'var(--active-tier,#3B7DDB)' } : { color:'#EDEAE4' }}
                    >
                      {/* Avatar circle */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          background: you ? 'rgba(59,125,219,0.2)' : 'rgba(255,255,255,0.06)',
                          border: you ? '1px solid var(--active-tier,#3B7DDB)' : '1px solid #2A2A2D',
                          color: you ? 'var(--active-tier,#3B7DDB)' : '#8A8A85',
                        }}
                      >
                        {name[0].toUpperCase()}
                      </div>

                      {/* Online indicator */}
                      <Circle
                        size={6}
                        fill={online ? '#22c55e' : '#3A3A3E'}
                        stroke="none"
                        className="shrink-0"
                      />

                      {/* Name */}
                      <span className="flex-1 text-left font-bold">{name}</span>

                      {/* Ratings */}
                      <span className="text-[#8A8A85]">CF</span>
                      <span className={you ? '' : 'text-[#EDEAE4]'}>{cf}</span>
                      <span className="text-[#8A8A85] ml-2">LC</span>
                      <span className={you ? '' : 'text-[#EDEAE4]'}>{lc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────
                ROW 02 — Head-to-Head Comparative Analysis
               ───────────────────────────────────────── */}
            <div className="border-t border-[#242426] py-16">
              <div className="flex items-center gap-2 mb-3">
                <IconVs />
                <span className="font-mono text-xs text-[#8A8A85]">02</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Text */}
                <div className="md:col-span-4 md:order-2 p-4 rounded-sm" style={{ background:'linear-gradient(90deg,rgba(10,11,13,0.88) 0%,transparent 100%)' }}>
                  <h3 className="text-2xl font-bold mb-3 text-[#EDEAE4]">Head-to-head analysis</h3>
                  <p className="text-base text-[#8A8A85] leading-relaxed">
                    Pick any rival and see exactly where you stand — across every metric, not just a rating number.
                  </p>
                </div>

                {/* Rich Comparison Widget */}
                <div className="md:col-span-8 md:order-1">
                  <div style={{ background:'rgba(10,11,13,0.90)', border:'1px solid #1F1F22', borderRadius:6, overflow:'hidden' }}>
                    {/* Two-column header */}
                    <div className="grid grid-cols-3 text-center border-b border-[#1F1F22] divide-x divide-[#1F1F22]">
                      <div className="py-4 font-mono text-xs" style={{ color:'var(--active-tier,#3B7DDB)' }}>
                        <div className="font-bold text-base">You</div>
                        <div className="text-[10px] text-[#8A8A85] mt-0.5">Candidate Master</div>
                      </div>
                      <div className="py-4 flex items-center justify-center">
                        <span className="font-mono text-[10px] uppercase text-[#8A8A85]">vs</span>
                      </div>
                      <div className="py-4 font-mono text-xs text-[#EDEAE4]">
                        <div className="font-bold text-base text-amber-400">nlogn</div>
                        <div className="text-[10px] text-[#8A8A85] mt-0.5">Master</div>
                      </div>
                    </div>

                    {/* Metric rows */}
                    <div className="divide-y divide-[#1F1F22]/60">
                      {[
                        { label:'CF Rating',        you:'1,847', them:'2,104', youWins:false },
                        { label:'Problems Solved',   you:'812',   them:'640',   youWins:true  },
                        { label:'Contest Count',     you:'47',    them:'61',    youWins:false },
                        { label:'Accuracy',          you:'68%',   them:'72%',   youWins:false },
                        { label:'Streak',            you:'14d',   them:'9d',    youWins:true  },
                      ].map(({ label, you, them, youWins }) => (
                        <div key={label} className="grid grid-cols-3 text-center items-center px-4 py-2.5 font-mono text-xs">
                          <div className={`font-bold ${youWins ? 'text-[var(--active-tier,#3B7DDB)]' : 'text-[#8A8A85]'}`}>
                            {you}
                          </div>
                          <div className="text-[#8A8A85] text-[10px]">{label}</div>
                          <div className={`font-bold ${!youWins ? 'text-amber-400' : 'text-[#8A8A85]'}`}>
                            {them}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mini radar chart */}
                    <div className="flex justify-center py-6 border-t border-[#1F1F22]/60">
                      <svg width="180" height="160" viewBox="0 0 180 160">
                        {/* Grid polygons */}
                        {[0.25, 0.5, 0.75, 1].map((scale, si) => {
                          const cx = 90, cy = 75, r = 65 * scale;
                          const pts = [0,1,2,3,4,5].map(i => {
                            const a = (i * 60 - 90) * Math.PI / 180;
                            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
                          }).join(' ');
                          return <polygon key={si} points={pts} fill="none" stroke="#2A2A2D" strokeWidth="0.5"/>;
                        })}
                        {/* Axes */}
                        {[0,1,2,3,4,5].map(i => {
                          const a = (i * 60 - 90) * Math.PI / 180;
                          return <line key={i} x1="90" y1="75" x2={90 + 65 * Math.cos(a)} y2={75 + 65 * Math.sin(a)} stroke="#2A2A2D" strokeWidth="0.5"/>;
                        })}
                        {/* You polygon */}
                        {(() => {
                          const vals = [0.55, 0.82, 0.65, 0.40, 0.72, 0.58];
                          const cx=90, cy=75, r=65;
                          const pts = vals.map((v,i) => {
                            const a = (i*60-90)*Math.PI/180;
                            return `${cx+r*v*Math.cos(a)},${cy+r*v*Math.sin(a)}`;
                          }).join(' ');
                          return <polygon points={pts} fill="rgba(59,125,219,0.15)" stroke="var(--active-tier,#3B7DDB)" strokeWidth="1.5"/>;
                        })()}
                        {/* Them polygon */}
                        {(() => {
                          const vals = [0.78, 0.60, 0.80, 0.70, 0.55, 0.75];
                          const cx=90, cy=75, r=65;
                          const pts = vals.map((v,i) => {
                            const a = (i*60-90)*Math.PI/180;
                            return `${cx+r*v*Math.cos(a)},${cy+r*v*Math.sin(a)}`;
                          }).join(' ');
                          return <polygon points={pts} fill="rgba(251,191,36,0.10)" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2"/>;
                        })()}
                        {/* Labels */}
                        {[
                          { label:'Graphs',   x:90,  y:5   },
                          { label:'Trees',    x:156, y:40  },
                          { label:'Math',     x:156, y:115 },
                          { label:'Strings',  x:90,  y:152 },
                          { label:'Greedy',   x:24,  y:115 },
                          { label:'DP',       x:24,  y:40  },
                        ].map(({ label, x, y }) => (
                          <text key={label} x={x} y={y} textAnchor="middle" fill="#8A8A85" fontSize="8" fontFamily="monospace">{label}</text>
                        ))}
                      </svg>
                      {/* Legend */}
                      <div className="flex flex-col justify-center gap-3 ml-4 font-mono text-[10px]">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-[1.5px]" style={{ background:'var(--active-tier,#3B7DDB)' }}/>
                          <span style={{ color:'var(--active-tier,#3B7DDB)' }}>You</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-[1.5px] bg-amber-400 opacity-70"/>
                          <span className="text-amber-400 opacity-70">nlogn</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────
                ROW 03 — Topic Weakness Analysis (anchor template)
               ───────────────────────────────────────── */}
            <div
              className="border-t border-[#242426] grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              style={{ paddingTop:'48px', paddingBottom:'48px' }}
            >
              {/* Text Left ~45% */}
              <div className="md:col-span-5 p-4 rounded-sm" style={{ background:'linear-gradient(90deg,rgba(10,11,13,0.88) 0%,transparent 100%)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <IconBars />
                  <span className="font-mono text-xs text-[#8A8A85]">03</span>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-[#EDEAE4]">Topic weakness analysis</h3>
                <p className="text-base text-[#8A8A85] leading-relaxed">
                  See exactly which topics drag your rating down. Arc maps every submission to your actual contest results — not guesswork.
                </p>
              </div>

              {/* Widget Right ~55% — Horizontal Bars */}
              <div className="md:col-span-7 flex justify-end">
                <div className="w-full max-w-md space-y-3.5 font-mono text-xs">
                  {[
                    { label:'Graphs',            pct:41, accent:true  },
                    { label:'Dynamic Programming', pct:58, accent:false },
                    { label:'Trees',             pct:72, accent:false },
                    { label:'Strings',           pct:81, accent:false },
                  ].map(({ label, pct, accent }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between">
                        <span style={{ color: accent ? 'var(--active-tier,#3B7DDB)' : '#8A8A85' }}>{label}</span>
                        <span style={{ color: accent ? 'var(--active-tier,#3B7DDB)' : '#8A8A85' }}>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#242426] overflow-hidden">
                        <div
                          className="h-full"
                          style={{ width:`${pct}%`, background: accent ? 'var(--active-tier,#3B7DDB)' : 'rgba(138,138,133,0.5)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────
                ROW 04 — Insights Feed (full-width, no rating line)
               ───────────────────────────────────────── */}
            <div className="border-t border-[#242426] pt-16 pb-8">
              <div className="flex items-center gap-2 mb-3">
                <IconFeed />
                <span className="font-mono text-xs text-[#8A8A85]">04</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Text block left */}
                <div className="md:order-2 p-4 rounded-sm" style={{ background:'linear-gradient(90deg,rgba(10,11,13,0.88) 0%,transparent 100%)' }}>
                  <h3 className="text-2xl font-bold mb-3 text-[#EDEAE4]">
                    Insights. Not just graphs.
                  </h3>
                  <p className="text-base text-[#8A8A85] leading-relaxed">
                    Arc interprets your data and surfaces the observations that matter — so you spend less time reading dashboards and more time improving.
                  </p>
                </div>

                {/* Insights Feed card — right side */}
                <div className="md:order-1 space-y-2" style={{ background:'rgba(10,11,13,0.0)' }}>
                  {[
                    {
                      icon: <ArrowUpRight size={14} stroke="var(--active-tier,#3B7DDB)" strokeWidth={2}/>,
                      text: 'Highest average problem rating solved this month.',
                      sub: '1,950 avg · previous best 1,820',
                      chip:'NEW BEST',
                      chipColor:'var(--active-tier,#3B7DDB)',
                      sparkUp: true,
                    },
                    {
                      icon: <TrendingUp size={14} stroke="#22c55e" strokeWidth={2}/>,
                      text: 'Current pace projects Expert in ~6 contests.',
                      sub: '+22.4 pts / contest avg',
                      chip:'PROJECTED',
                      chipColor:'#22c55e',
                      sparkUp: true,
                    },
                    {
                      icon: <Zap size={14} stroke="#F59E0B" strokeWidth={2}/>,
                      text: 'Average solve time improved by 18%.',
                      sub: '34 min → 28 min per accepted submission',
                      chip:'HIGH CONFIDENCE',
                      chipColor:'#F59E0B',
                      sparkUp: true,
                    },
                    {
                      icon: <ArrowDownRight size={14} stroke="#8A8A85" strokeWidth={2}/>,
                      text: 'Highest rated among your active friends this week.',
                      sub: 'nlogn is 257 pts behind · gap widening',
                      chip:'THIS WEEK',
                      chipColor:'#8A8A85',
                      sparkUp: false,
                    },
                  ].map(({ icon, text, sub, chip, chipColor, sparkUp }, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5"
                      style={{ borderLeft:`2px solid ${chipColor}22`, background:'rgba(10,11,13,0.55)' }}
                    >
                      <div className="mt-0.5 shrink-0">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-mono text-xs text-[#EDEAE4]">{text}</span>
                          <span
                            className="font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-sm"
                            style={{ background:`${chipColor}18`, color: chipColor, border:`1px solid ${chipColor}44` }}
                          >
                            {chip}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] text-[#8A8A85]">{sub}</span>
                          <Sparkline up={sparkUp} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CHAPTER IV — Proof
         ════════════════════════════════════════ */}
      <section className="relative w-full py-28 overflow-hidden">
        <Watermark label="IV" side="left" />
        <div className="mx-auto max-w-7xl px-8 lg:px-16 relative z-10">
          <div className="mb-12">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8A8A85] block mb-3">IV · PROOF</span>
            <h2 className="font-bold tracking-tight text-[#EDEAE4]" style={{ fontSize:'clamp(2.5rem,5vw,4rem)', lineHeight:1.05 }}>
              All your data. Finally makes sense.
            </h2>
          </div>

          {/* Viewfinder screenshot placeholder */}
          <div className="relative w-full max-w-5xl mx-auto">
            <div style={{ position:'relative', border:'1px solid #242426', borderRadius:4, aspectRatio:'16/9', background:'rgba(10,11,13,0.65)', overflow:'hidden' }}>
              {[
                { top:12, left:12, borderTop:'1px solid', borderLeft:'1px solid', borderTopLeftRadius:2 },
                { top:12, right:12, borderTop:'1px solid', borderRight:'1px solid', borderTopRightRadius:2 },
                { bottom:12, left:12, borderBottom:'1px solid', borderLeft:'1px solid', borderBottomLeftRadius:2 },
                { bottom:12, right:12, borderBottom:'1px solid', borderRight:'1px solid', borderBottomRightRadius:2 },
              ].map((style, i) => (
                <div key={i} style={{ position:'absolute', width:20, height:20, borderColor:'var(--active-tier,#3B7DDB)', ...style }} />
              ))}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#8A8A85] mb-2">
                  {/* SCREENSHOT: full dashboard — sidebar nav, stat cards, rating graph, topic radar chart */}
                  PRODUCT DASHBOARD MOCKUP
                </span>
                <span className="font-mono text-[11px] text-[#242426] max-w-md">
                  Unified Codeforces &amp; LeetCode rating curve, topic radar chart, contest calendar, and weakness analytics.
                </span>
              </div>
              <div aria-hidden style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px)', pointerEvents:'none' }} />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
