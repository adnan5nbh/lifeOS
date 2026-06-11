"use client";

import { MuscleGroup } from "@/lib/health/types";
import { MUSCLE_LABELS } from "@/lib/health/constants";

const NEUTRAL_FILL = "#334155"; // slate-700
const NEUTRAL_STROKE = "#64748b"; // slate-500
const WORKED_FILL = "#6366f1"; // indigo-500
const WORKED_STROKE = "#4338ca"; // indigo-700

type Region = {
  muscle?: MuscleGroup;
  shape: "rect" | "ellipse";
  // rect: x, y, width, height, rx
  // ellipse: cx, cy, rx, ry
  props: Record<string, number>;
};

// Front-view body, drawn on a 0 0 200 300 canvas.
const FRONT_REGIONS: Region[] = [
  { shape: "ellipse", props: { cx: 100, cy: 20, rx: 16, ry: 16 } }, // head
  { shape: "rect", props: { x: 93, y: 34, width: 14, height: 8, rx: 2 } }, // neck
  { muscle: "shoulders", shape: "ellipse", props: { cx: 66, cy: 50, rx: 15, ry: 11 } },
  { muscle: "shoulders", shape: "ellipse", props: { cx: 134, cy: 50, rx: 15, ry: 11 } },
  { muscle: "chest", shape: "rect", props: { x: 72, y: 44, width: 56, height: 36, rx: 8 } },
  { muscle: "abs", shape: "rect", props: { x: 78, y: 82, width: 44, height: 44, rx: 6 } },
  { muscle: "biceps", shape: "rect", props: { x: 46, y: 48, width: 17, height: 52, rx: 8 } },
  { muscle: "biceps", shape: "rect", props: { x: 137, y: 48, width: 17, height: 52, rx: 8 } },
  { shape: "rect", props: { x: 46, y: 104, width: 15, height: 46, rx: 6 } }, // forearm
  { shape: "rect", props: { x: 139, y: 104, width: 15, height: 46, rx: 6 } }, // forearm
  { shape: "ellipse", props: { cx: 53, cy: 156, rx: 7, ry: 7 } }, // hand
  { shape: "ellipse", props: { cx: 146, cy: 156, rx: 7, ry: 7 } }, // hand
  { shape: "rect", props: { x: 74, y: 126, width: 52, height: 22, rx: 6 } }, // hips
  { muscle: "quads", shape: "rect", props: { x: 74, y: 148, width: 24, height: 68, rx: 8 } },
  { muscle: "quads", shape: "rect", props: { x: 102, y: 148, width: 24, height: 68, rx: 8 } },
  { muscle: "calves", shape: "rect", props: { x: 76, y: 218, width: 20, height: 54, rx: 6 } },
  { muscle: "calves", shape: "rect", props: { x: 104, y: 218, width: 20, height: 54, rx: 6 } },
  { shape: "ellipse", props: { cx: 86, cy: 276, rx: 12, ry: 6 } }, // foot
  { shape: "ellipse", props: { cx: 114, cy: 276, rx: 12, ry: 6 } }, // foot
];

// Back-view body — same skeleton, different muscles highlighted.
const BACK_REGIONS: Region[] = [
  { shape: "ellipse", props: { cx: 100, cy: 20, rx: 16, ry: 16 } }, // head
  { shape: "rect", props: { x: 93, y: 34, width: 14, height: 8, rx: 2 } }, // neck
  { muscle: "shoulders", shape: "ellipse", props: { cx: 66, cy: 50, rx: 15, ry: 11 } },
  { muscle: "shoulders", shape: "ellipse", props: { cx: 134, cy: 50, rx: 15, ry: 11 } },
  { muscle: "back", shape: "rect", props: { x: 72, y: 44, width: 56, height: 36, rx: 8 } },
  { muscle: "back", shape: "rect", props: { x: 78, y: 82, width: 44, height: 44, rx: 6 } },
  { muscle: "triceps", shape: "rect", props: { x: 46, y: 48, width: 17, height: 52, rx: 8 } },
  { muscle: "triceps", shape: "rect", props: { x: 137, y: 48, width: 17, height: 52, rx: 8 } },
  { shape: "rect", props: { x: 46, y: 104, width: 15, height: 46, rx: 6 } }, // forearm
  { shape: "rect", props: { x: 139, y: 104, width: 15, height: 46, rx: 6 } }, // forearm
  { shape: "ellipse", props: { cx: 53, cy: 156, rx: 7, ry: 7 } }, // hand
  { shape: "ellipse", props: { cx: 146, cy: 156, rx: 7, ry: 7 } }, // hand
  { muscle: "glutes", shape: "rect", props: { x: 74, y: 126, width: 52, height: 22, rx: 6 } },
  { muscle: "hamstrings", shape: "rect", props: { x: 74, y: 148, width: 24, height: 68, rx: 8 } },
  { muscle: "hamstrings", shape: "rect", props: { x: 102, y: 148, width: 24, height: 68, rx: 8 } },
  { muscle: "calves", shape: "rect", props: { x: 76, y: 218, width: 20, height: 54, rx: 6 } },
  { muscle: "calves", shape: "rect", props: { x: 104, y: 218, width: 20, height: 54, rx: 6 } },
  { shape: "ellipse", props: { cx: 86, cy: 276, rx: 12, ry: 6 } }, // foot
  { shape: "ellipse", props: { cx: 114, cy: 276, rx: 12, ry: 6 } }, // foot
];

function Figure({
  regions,
  worked,
}: {
  regions: Region[];
  worked: Set<MuscleGroup>;
}) {
  return (
    <svg viewBox="0 0 200 300" className="h-64 w-auto">
      {regions.map((region, i) => {
        const isWorked = region.muscle ? worked.has(region.muscle) : false;
        const fill = isWorked ? WORKED_FILL : NEUTRAL_FILL;
        const stroke = isWorked ? WORKED_STROKE : NEUTRAL_STROKE;

        if (region.shape === "rect") {
          return (
            <rect
              key={i}
              x={region.props.x}
              y={region.props.y}
              width={region.props.width}
              height={region.props.height}
              rx={region.props.rx}
              fill={fill}
              stroke={stroke}
              strokeWidth={1}
            >
              {region.muscle && <title>{MUSCLE_LABELS[region.muscle]}</title>}
            </rect>
          );
        }

        return (
          <ellipse
            key={i}
            cx={region.props.cx}
            cy={region.props.cy}
            rx={region.props.rx}
            ry={region.props.ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
          >
            {region.muscle && <title>{MUSCLE_LABELS[region.muscle]}</title>}
          </ellipse>
        );
      })}
    </svg>
  );
}

export default function BodyDiagram({ worked }: { worked: Set<MuscleGroup> }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <Figure regions={FRONT_REGIONS} worked={worked} />
          <span className="text-xs font-medium text-slate-400">Front</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Figure regions={BACK_REGIONS} worked={worked} />
          <span className="text-xs font-medium text-slate-400">Back</span>
        </div>
      </div>
      {worked.size > 0 ? (
        <p className="text-center text-xs text-slate-400">
          Worked today:{" "}
          {Array.from(worked)
            .map((m) => MUSCLE_LABELS[m])
            .join(", ")}
        </p>
      ) : (
        <p className="text-center text-xs text-slate-500">
          No muscles logged yet today.
        </p>
      )}
    </div>
  );
}
