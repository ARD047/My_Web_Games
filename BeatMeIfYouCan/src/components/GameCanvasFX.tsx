import { useEffect, useRef } from 'react';
import type { SoundPackId } from '../engine/asmrAudio';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  gravity: number;
  shape: 'circle' | 'square' | 'drop';
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  lineWidth: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
}

export interface FxController {
  burst: (
    x: number,
    y: number,
    pack: SoundPackId,
    intensity?: 'soft' | 'normal' | 'heavy',
    colorOverride?: string
  ) => void;
  floatText: (x: number, y: number, text: string, color?: string) => void;
}

const PACK_PALETTES: Record<
  SoundPackId,
  { colors: string[]; shape: 'circle' | 'square' | 'drop'; gravity: number }
> = {
  walnut: {
    colors: ['#F59E0B', '#FF5A5F', '#FBBF24', '#38BDF8'],
    shape: 'square',
    gravity: 0.16,
  },
  mechanical: {
    colors: ['#3B82F6', '#FBBF24', '#FF5A5F', '#10B981'],
    shape: 'square',
    gravity: 0.22,
  },
  stone: {
    colors: ['#10B981', '#38BDF8', '#FBBF24', '#6366F1'],
    shape: 'circle',
    gravity: 0.18,
  },
  raindrop: {
    colors: ['#0EA5E9', '#38BDF8', '#7DD3FC', '#2563EB'],
    shape: 'drop',
    gravity: 0.22,
  },
  velvet: {
    colors: ['#EC4899', '#F472B6', '#FBBF24', '#38BDF8'],
    shape: 'circle',
    gravity: -0.04,
  },
};

interface GameCanvasFXProps {
  controllerRef: React.MutableRefObject<FxController | null>;
}

export function GameCanvasFX({ controllerRef }: GameCanvasFXProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const ripples: Ripple[] = [];
    const floats: FloatingText[] = [];

    controllerRef.current = {
      burst(x, y, pack, intensity = 'normal', colorOverride) {
        const cfg = PACK_PALETTES[pack] ?? PACK_PALETTES.walnut;
        const count = intensity === 'heavy' ? 34 : intensity === 'soft' ? 9 : 18;
        const speedMult = intensity === 'heavy' ? 1.75 : intensity === 'soft' ? 0.65 : 1.05;

        ripples.push({
          x,
          y,
          radius: 14,
          maxRadius: intensity === 'heavy' ? 175 : intensity === 'soft' ? 56 : 96,
          alpha: intensity === 'heavy' ? 0.9 : 0.72,
          color: colorOverride ?? cfg.colors[0],
          lineWidth: intensity === 'heavy' ? 5 : 3.5,
        });

        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
          const speed = (1.8 + Math.random() * 4.2) * speedMult;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (intensity === 'heavy' ? 2.2 : 1.1),
            size: (intensity === 'heavy' ? 5.5 : 4.2) + Math.random() * 3.5,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.015,
            color: colorOverride ?? cfg.colors[i % cfg.colors.length],
            gravity: cfg.gravity,
            shape: cfg.shape,
          });
        }
      },
      floatText(x, y, text, color = '#F59E0B') {
        floats.push({
          x,
          y,
          vy: -1.45,
          text,
          color,
          alpha: 1,
        });
      },
    };

    let rafId = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // Bold cartoon wave ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += (r.maxRadius - r.radius) * 0.15;
        r.alpha *= 0.9;
        if (r.alpha < 0.03) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = r.alpha;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.lineWidth;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Cel-shaded comic confetti / droplet particles with ink outline
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.97;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.6;
        if (p.shape === 'square') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.vx * 0.35);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'drop') {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 0.52, p.size * 0.85, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.58, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // Bold comic-outlined floating coin popups (+4)
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i];
        f.y += f.vy;
        f.alpha -= 0.02;
        if (f.alpha <= 0) {
          floats.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.font = '700 18px "Fredoka", "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1E293B';
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      controllerRef.current = null;
    };
  }, [controllerRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
    />
  );
}
