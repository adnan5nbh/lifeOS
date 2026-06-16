"use client";

import { useRef } from "react";

interface Props {
  valence: number; // -1 to 1
  arousal: number; // -1 to 1
  onChange: (valence: number, arousal: number) => void;
  size?: number;
}

export default function ValenceArousalGrid({ valence, arousal, onChange, size = 200 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  function clamp(v: number) { return Math.max(-1, Math.min(1, v)); }

  function fromEvent(e: React.MouseEvent | React.TouchEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const x = clamp(((clientX - rect.left) / rect.width - 0.5) * 2);
    const y = clamp(-(((clientY - rect.top) / rect.height - 0.5) * 2));
    onChange(x, y);
  }

  const dotX = ((valence + 1) / 2) * size;
  const dotY = ((1 - arousal) / 2) * size;

  const quadrantLabel = () => {
    if (valence > 0.15 && arousal > 0.15) return "Excited / Energised";
    if (valence > 0.15 && arousal < -0.15) return "Calm / Content";
    if (valence < -0.15 && arousal > 0.15) return "Anxious / Stressed";
    if (valence < -0.15 && arousal < -0.15) return "Sad / Fatigued";
    return "Neutral";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative text-[10px] text-slate-500" style={{ width: size, height: size }}>
        <svg
          ref={svgRef}
          width={size} height={size}
          className="rounded-xl border border-slate-700 cursor-crosshair"
          style={{ touchAction: "none" }}
          onMouseDown={fromEvent}
          onMouseMove={e => { if (e.buttons > 0) fromEvent(e); }}
          onTouchStart={fromEvent}
          onTouchMove={fromEvent}
        >
          <defs>
            <radialGradient id="grid-bg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width={size} height={size} rx="10" fill="url(#grid-bg)" />

          {/* Quadrant tints */}
          <rect x={size/2} y={0} width={size/2} height={size/2} rx="0" fill="#22c55e" fillOpacity="0.05" />
          <rect x={0} y={0} width={size/2} height={size/2} fill="#ef4444" fillOpacity="0.05" />
          <rect x={size/2} y={size/2} width={size/2} height={size/2} fill="#6366f1" fillOpacity="0.05" />
          <rect x={0} y={size/2} width={size/2} height={size/2} fill="#64748b" fillOpacity="0.05" />

          {/* Axes */}
          <line x1={size/2} y1={8} x2={size/2} y2={size-8} stroke="#334155" strokeWidth="1" />
          <line x1={8} y1={size/2} x2={size-8} y2={size/2} stroke="#334155" strokeWidth="1" />

          {/* Axis labels */}
          <text x={size/2} y={12} textAnchor="middle" fontSize="8" fill="#64748b">Energised</text>
          <text x={size/2} y={size-4} textAnchor="middle" fontSize="8" fill="#64748b">Calm</text>
          <text x={4} y={size/2+3} textAnchor="start" fontSize="8" fill="#64748b">−</text>
          <text x={size-4} y={size/2+3} textAnchor="end" fontSize="8" fill="#64748b">+</text>

          {/* Dot glow */}
          <circle cx={dotX} cy={dotY} r={14} fill="#6366f1" fillOpacity="0.15" />
          <circle cx={dotX} cy={dotY} r={8} fill="#818cf8" fillOpacity="0.3" />
          <circle cx={dotX} cy={dotY} r={5} fill="#a5b4fc" />
        </svg>
        <span className="absolute left-1 top-1 text-[9px] text-rose-400/70">Stressed</span>
        <span className="absolute right-1 top-1 text-[9px] text-green-400/70">Excited</span>
        <span className="absolute left-1 bottom-1 text-[9px] text-slate-500">Sad</span>
        <span className="absolute right-1 bottom-1 text-[9px] text-indigo-400/70">Content</span>
      </div>
      <p className="text-xs text-slate-400">{quadrantLabel()}</p>
    </div>
  );
}
