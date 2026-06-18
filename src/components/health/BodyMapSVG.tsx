"use client";

import { MuscleGroup } from "@/lib/health/types";
import { MuscleActivityEntry } from "@/lib/health/useTodayWorkout";

interface Props {
  muscleActivity: Partial<Record<MuscleGroup, MuscleActivityEntry>>;
}

function muscleColor(sets: number): string {
  if (sets === 0) return "#1e293b";
  if (sets <= 2) return "#4c1d95";
  if (sets <= 5) return "#7e22ce";
  return "#a855f7";
}

function MuscleRegion({
  muscle, activity, children,
}: {
  muscle: MuscleGroup;
  activity: Partial<Record<MuscleGroup, MuscleActivityEntry>>;
  children: React.ReactNode;
}) {
  const sets = activity[muscle]?.sets ?? 0;
  const fill = muscleColor(sets);
  const worked = sets > 0;
  return (
    <g fill={fill} opacity={worked ? 1 : 0.6}
      style={{ transition: "fill 0.4s ease" }}>
      {children}
    </g>
  );
}

function FrontView({ activity }: { activity: Props["muscleActivity"] }) {
  return (
    <svg viewBox="0 0 120 290" className="w-full" aria-label="Front body view">
      {/* silhouette */}
      <ellipse cx="60" cy="18" rx="14" ry="15" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="53" y="33" width="14" height="10" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      {/* torso */}
      <path d="M30,43 L90,43 L96,60 L88,130 L80,145 L40,145 L32,130 L24,60 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      {/* hip */}
      <path d="M40,145 L80,145 L82,162 L38,162 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      {/* left leg */}
      <rect x="33" y="162" width="28" height="80" rx="7" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="35" y="244" width="22" height="58" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      {/* right leg */}
      <rect x="59" y="162" width="28" height="80" rx="7" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="63" y="244" width="22" height="58" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      {/* left arm */}
      <rect x="16" y="46" width="15" height="52" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="17" y="100" width="13" height="42" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      {/* right arm */}
      <rect x="89" y="46" width="15" height="52" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="90" y="100" width="13" height="42" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />

      {/* === MUSCLE REGIONS === */}

      {/* Shoulders / front deltoid */}
      <MuscleRegion muscle="shoulders" activity={activity}>
        <ellipse cx="30" cy="55" rx="13" ry="10" />
        <ellipse cx="90" cy="55" rx="13" ry="10" />
      </MuscleRegion>

      {/* Chest */}
      <MuscleRegion muscle="chest" activity={activity}>
        <path d="M44,44 L60,44 L60,88 C52,91 38,84 32,68 Z" />
        <path d="M60,44 L76,44 L88,68 C82,84 68,91 60,88 Z" />
      </MuscleRegion>

      {/* Biceps */}
      <MuscleRegion muscle="biceps" activity={activity}>
        <rect x="17" y="50" width="13" height="46" rx="5" />
        <rect x="90" y="50" width="13" height="46" rx="5" />
      </MuscleRegion>

      {/* Triceps (visible from front at sides of upper arm) */}
      <MuscleRegion muscle="triceps" activity={activity}>
        <rect x="16" y="58" width="5" height="36" rx="2" />
        <rect x="99" y="58" width="5" height="36" rx="2" />
      </MuscleRegion>

      {/* Abs */}
      <MuscleRegion muscle="abs" activity={activity}>
        <rect x="44" y="88" width="14" height="16" rx="2" />
        <rect x="62" y="88" width="14" height="16" rx="2" />
        <rect x="44" y="108" width="14" height="16" rx="2" />
        <rect x="62" y="108" width="14" height="16" rx="2" />
        <rect x="44" y="128" width="14" height="12" rx="2" />
        <rect x="62" y="128" width="14" height="12" rx="2" />
      </MuscleRegion>

      {/* Quads */}
      <MuscleRegion muscle="quads" activity={activity}>
        <rect x="35" y="165" width="24" height="74" rx="7" />
        <rect x="61" y="165" width="24" height="74" rx="7" />
      </MuscleRegion>

      {/* Calves front */}
      <MuscleRegion muscle="calves" activity={activity}>
        <rect x="37" y="247" width="18" height="52" rx="5" />
        <rect x="65" y="247" width="18" height="52" rx="5" />
      </MuscleRegion>
    </svg>
  );
}

function BackView({ activity }: { activity: Props["muscleActivity"] }) {
  return (
    <svg viewBox="0 0 120 290" className="w-full" aria-label="Back body view">
      {/* silhouette */}
      <ellipse cx="60" cy="18" rx="14" ry="15" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="53" y="33" width="14" height="10" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <path d="M30,43 L90,43 L96,60 L88,130 L80,145 L40,145 L32,130 L24,60 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <path d="M40,145 L80,145 L82,162 L38,162 Z" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="33" y="162" width="28" height="80" rx="7" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="35" y="244" width="22" height="58" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="59" y="162" width="28" height="80" rx="7" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="63" y="244" width="22" height="58" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="16" y="46" width="15" height="52" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="17" y="100" width="13" height="42" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="89" y="46" width="15" height="52" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="90" y="100" width="13" height="42" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />

      {/* === MUSCLE REGIONS === */}

      {/* Rear deltoids */}
      <MuscleRegion muscle="shoulders" activity={activity}>
        <ellipse cx="30" cy="55" rx="13" ry="10" />
        <ellipse cx="90" cy="55" rx="13" ry="10" />
      </MuscleRegion>

      {/* Trapezius / upper back */}
      <MuscleRegion muscle="back" activity={activity}>
        <path d="M44,44 L76,44 L84,65 L36,65 Z" />
        {/* Lats */}
        <path d="M32,63 C20,78 22,106 30,114 L50,98 L46,63 Z" />
        <path d="M88,63 C100,78 98,106 90,114 L70,98 L74,63 Z" />
        {/* Mid/lower back */}
        <rect x="44" y="114" width="32" height="24" rx="4" />
      </MuscleRegion>

      {/* Triceps */}
      <MuscleRegion muscle="triceps" activity={activity}>
        <rect x="17" y="50" width="13" height="46" rx="5" />
        <rect x="90" y="50" width="13" height="46" rx="5" />
      </MuscleRegion>

      {/* Glutes */}
      <MuscleRegion muscle="glutes" activity={activity}>
        <rect x="36" y="148" width="26" height="34" rx="9" />
        <rect x="58" y="148" width="26" height="34" rx="9" />
      </MuscleRegion>

      {/* Hamstrings */}
      <MuscleRegion muscle="hamstrings" activity={activity}>
        <rect x="35" y="184" width="24" height="70" rx="7" />
        <rect x="61" y="184" width="24" height="70" rx="7" />
      </MuscleRegion>

      {/* Calves back */}
      <MuscleRegion muscle="calves" activity={activity}>
        <rect x="37" y="247" width="18" height="52" rx="5" />
        <rect x="65" y="247" width="18" height="52" rx="5" />
      </MuscleRegion>
    </svg>
  );
}

export default function BodyMapSVG({ muscleActivity }: Props) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <p className="mb-1 text-center text-[10px] text-slate-500">Front</p>
        <FrontView activity={muscleActivity} />
      </div>
      <div className="flex-1">
        <p className="mb-1 text-center text-[10px] text-slate-500">Back</p>
        <BackView activity={muscleActivity} />
      </div>
    </div>
  );
}
