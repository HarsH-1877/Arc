'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RANK_MILESTONES } from '@/lib/landing-tokens';

gsap.registerPlugin(ScrollTrigger);

// Exact pixel-by-pixel coordinates from the reference image.
const LABEL_POINTS = [
  { left: 47.5, top: 77.5 },
  { left: 54.2, top: 66.8 },
  { left: 61.2, top: 53.5 },
  { left: 66.1, top: 41.5 },
  { left: 69.5, top: 28.5 },
  { left: 71.6, top: 17.2 },
];

const TRAIL_D = 'M 12 96 C 25 93, 38 88, 47.5 77.5 C 51 70, 53 69, 54.2 66.8 C 57 59, 59 57, 61.2 53.5 C 63 48, 64 45, 66.1 41.5 C 68 35, 68.5 32, 69.5 28.5 C 70.5 23, 70.6 18, 70.8 16.2';



export function MountainTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const trailBlurRef = useRef<SVGPathElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const layerBRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement[]>([]);
  const unlocked = useRef<boolean[]>(RANK_MILESTONES.map(() => false));
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Static gradient line on mobile
      if (containerRef.current) {
        containerRef.current.style.background =
          'linear-gradient(to top, rgba(59,125,219,0.15), transparent)';
      }
      return;
    }

    const trail = trailRef.current;
    const trailBlur = trailBlurRef.current;
    if (!trail || !trailBlur) return;

    // Use pathLength="1" for reliable stroke animating
    gsap.set([trail, trailBlur], {
      strokeDasharray: 1,
      strokeDashoffset: 1,
    });

    // Active tier color starts as newbie color, updated on scroll
    let activeTier: string = RANK_MILESTONES[0].color;

    // Flicker loop for core glow (real-time, not scroll-driven)
    let flickerPhase = 0;
    let lastTs = 0;
    function flickerTick(ts: number) {
      if (!prefersReduced) {
        const dt = ts - lastTs;
        lastTs = ts;
        flickerPhase += dt * 0.002;
        const wobble = Math.sin(flickerPhase) * 0.03;
        if (coreRef.current) {
          coreRef.current.style.opacity = String(Math.min(1, 0.9 + wobble));
        }
      }
      rafId.current = requestAnimationFrame(flickerTick);
    }
    rafId.current = requestAnimationFrame(flickerTick);

    // Main scroll trigger
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate(self) {
        const progress = self.progress; // 0–1

        // Glow reaches summit at 0.95 and locks, preventing drift during payoff scale
        const boundedProgress = Math.min(progress / 0.95, 1.0);

        // Trail reveal — offset animates from 1→0, perfectly in sync with glow
        trail.style.strokeDashoffset = String(1 - boundedProgress);
        trailBlur.style.strokeDashoffset = String(1 - boundedProgress);

        // Overall trail opacity per progress zones
        let trailOpacity = 0;
        if (progress < 0.1) trailOpacity = 0.15 + progress * 1.0;
        else if (progress < 0.2) trailOpacity = 0.25 + (progress - 0.1) * 1.0;
        else if (progress < 0.32) trailOpacity = 0.35 + (progress - 0.2) * 0.4;
        else if (progress < 0.45) trailOpacity = 0.42 + (progress - 0.32) * 0.6;
        else if (progress < 0.58) trailOpacity = 0.50 + (progress - 0.45) * 0.8;
        else if (progress < 0.72) trailOpacity = 0.60 + (progress - 0.58) * 0.7;
        else if (progress < 0.85) trailOpacity = 0.70 + (progress - 0.72) * 2.3;
        else trailOpacity = 1;

        if (svgRef.current) {
          svgRef.current.style.opacity = String(trailOpacity);
        }

        // Glow position
        const measureLen = trail.getTotalLength() || 100;
        const pt = trail.getPointAtLength(boundedProgress * measureLen);
        const glowX = pt.x;
        const glowY = pt.y;

        document.documentElement.style.setProperty('--glow-x', `${glowX}%`);
        document.documentElement.style.setProperty('--glow-y', `${glowY}%`);

        if (coreRef.current) {
          coreRef.current.style.left = `${glowX}%`;
          coreRef.current.style.top = `${glowY}%`;
        }
        if (haloRef.current) {
          haloRef.current.style.left = `${glowX}%`;
          haloRef.current.style.top = `${glowY}%`;
        }
        if (ambientRef.current) {
          ambientRef.current.style.left = `${glowX}%`;
          ambientRef.current.style.top = `${glowY}%`;
        }

        // Layer B mask follows glow
        if (layerBRef.current) {
          layerBRef.current.style.maskImage = `radial-gradient(circle at ${glowX}% ${glowY}%, black 0%, transparent 65%)`;
          layerBRef.current.style.webkitMaskImage = layerBRef.current.style.maskImage;
        }

        // Active tier: find the last milestone crossed
        let tierColor: string = RANK_MILESTONES[0].color;
        for (const m of RANK_MILESTONES) {
          if (progress >= m.progress) tierColor = m.color;
        }
        if (tierColor !== activeTier) {
          activeTier = tierColor;
          document.documentElement.style.setProperty('--active-tier', tierColor);
          if (haloRef.current) {
            haloRef.current.style.background = `radial-gradient(circle, ${tierColor}66 0%, transparent 70%)`;
          }
          if (ambientRef.current) {
            ambientRef.current.style.background = `radial-gradient(circle, ${tierColor}1A 0%, transparent 70%)`;
          }
        }

        // Milestone unlock animations
        RANK_MILESTONES.forEach((m, i) => {
          if (!unlocked.current[i] && progress >= m.progress) {
            unlocked.current[i] = true;
            const el = labelsRef.current[i];
            if (el) {
              // Light-sweep unlock animation
              gsap.to(el, {
                opacity: 1,
                filter: 'saturate(1)',
                duration: 0.4,
                ease: 'power2.out',
              });
              gsap.fromTo(
                el,
                { scale: 1 },
                { scale: 1.04, yoyo: true, repeat: 1, duration: 0.25, ease: 'back.out(1.7)' },
              );
              el.style.setProperty('--sweep-color', m.color);
              el.classList.add('label-sweep');
              setTimeout(() => el.classList.remove('label-sweep'), 500);
            }
          }
        });

        // Payoff section — mountain scales up at 85%+
        if (containerRef.current && progress > 0.85) {
          const t = (progress - 0.85) / 0.15;
          containerRef.current.style.transform = `scale(${1 + t * 0.06})`;
        }
      },
    });

    return () => {
      trigger.kill();
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      className="mountain-trail-container"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        transformOrigin: 'center center',
      }}
    >
      {/* Layer A — exact background image provided by user, darkened to make trail pop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/bg-original.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)',
        }}
      />

      {/* Global base overlay — subtle dark gradient purely for left-aligned text legibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(10,11,13,0.85) 0%, rgba(10,11,13,0.30) 40%, transparent 100%)',
        }}
      />

      {/* Trail SVG */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          opacity: 0.15,
          transition: 'opacity 0.3s',
        }}
      >
        <defs>
          <linearGradient id="trailGrad" gradientUnits="userSpaceOnUse" x1="12" y1="96" x2="70.8" y2="16.2">
            <stop offset="0%" stopColor="var(--active-tier, #3B7DDB)" stopOpacity="0.15" />
            <stop offset="60%" stopColor="var(--active-tier, #3B7DDB)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0.95" />
          </linearGradient>
          <filter id="trailBlur">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Blur/bleed duplicate underneath */}
        <path
          ref={trailBlurRef}
          d={TRAIL_D}
          pathLength="1"
          fill="none"
          stroke="var(--active-tier, #3B7DDB)"
          strokeWidth="1.8"
          strokeLinecap="round"
          filter="url(#trailBlur)"
          opacity="0.6"
        />

        {/* Main trail */}
        <path
          ref={trailRef}
          d={TRAIL_D}
          pathLength="1"
          fill="none"
          stroke="url(#trailGrad)"
          strokeWidth="0.6"
          strokeLinecap="round"
        />
      </svg>

      {/* Glow layers — positioned via transform, never live-blurred */}
      {/* Core glow */}
      <div
        ref={coreRef}
        style={{
          position: 'absolute',
          left: '12%',
          top: '96%',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 0 16px white, 0 0 32px var(--active-tier, #3B7DDB)',
          transform: 'translate(-50%, -50%)',
          willChange: 'left, top',
        }}
      />

      {/* Halo glow */}
      <div
        ref={haloRef}
        style={{
          position: 'absolute',
          left: '12%',
          top: '96%',
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${RANK_MILESTONES[0].color}55 0%, transparent 70%)`,
          filter: 'blur(8px)',
          transform: 'translate(-50%, -50%)',
          opacity: 0.38,
          willChange: 'left, top',
        }}
      />

      {/* Ambient spill */}
      <div
        ref={ambientRef}
        style={{
          position: 'absolute',
          left: '12%',
          top: '96%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${RANK_MILESTONES[0].color}18 0%, transparent 70%)`,
          filter: 'blur(24px)',
          transform: 'translate(-50%, -50%)',
          mixBlendMode: 'screen',
          opacity: 0.08,
          willChange: 'left, top',
        }}
      />

      {/* Rank milestone labels */}
      {RANK_MILESTONES.map((m, i) => (
        <div
          key={m.label}
          ref={(el) => { if (el) labelsRef.current[i] = el; }}
          style={{
            position: 'absolute',
            left: `${LABEL_POINTS[i].left}%`,
            top: `${LABEL_POINTS[i].top}%`,
            opacity: 0,
            filter: 'saturate(0)',
            userSelect: 'none',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Dot node on trail */}
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: m.color,
              boxShadow: `0 0 10px ${m.color}`,
            }}
          />
          {/* Text labels absolute positioned next to dot */}
          <div style={{ position: 'absolute', left: 16, top: -4, whiteSpace: 'nowrap' }}>
            <span
              className="font-mono font-bold uppercase tracking-widest"
              style={{ fontSize: i === RANK_MILESTONES.length - 1 ? '11px' : '10px', color: m.color, letterSpacing: '0.1em', display: 'block', lineHeight: 1 }}
            >
              {m.rating}{i === RANK_MILESTONES.length - 1 ? '+' : ''}
            </span>
            <span
              className="font-mono text-[9px] uppercase tracking-[0.12em]"
              style={{ color: m.color, opacity: 0.75, display: 'block', lineHeight: 1, marginTop: 4 }}
            >
              {m.label}
            </span>
          </div>
        </div>
      ))}

      {/* Grain overlay */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.03,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      >
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
