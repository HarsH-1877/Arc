'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface NodeBackgroundProps {
  className?: string;
  opacity?: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createNodes(count: number, width: number, height: number): Node[] {
  const random = seededRandom(42);
  return Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height,
    vx: (random() - 0.5) * 0.3,
    vy: (random() - 0.5) * 0.3,
  }));
}

const CONNECTION_DISTANCE = 150;
const NODE_COUNT = 70;
const NODE_RADIUS = 1.5;

export function NodeBackground({ className, opacity }: NodeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number>();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (nodesRef.current.length === 0) {
        nodesRef.current = createNodes(NODE_COUNT, width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const nodes = nodesRef.current;
      const nodeOpacity = opacity ?? 0.04;

      ctx.clearRect(0, 0, width, height);

      if (!reducedMotion) {
        for (const node of nodes) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x <= 0 || node.x >= width) node.vx *= -1;
          if (node.y <= 0 || node.y >= height) node.vy *= -1;

          node.x = Math.max(0, Math.min(width, node.x));
          node.y = Math.max(0, Math.min(height, node.y));
        }
      }

      ctx.strokeStyle = `rgba(124, 58, 237, ${nodeOpacity * 2})`;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * nodeOpacity * 3;
            ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = `rgba(196, 181, 253, ${nodeOpacity * 4})`;
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [reducedMotion, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: opacity ?? 'var(--node-bg-opacity)',
      }}
    />
  );
}
