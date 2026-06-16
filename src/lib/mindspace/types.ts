export interface DailyCheckin {
  id: string;
  date: string;
  valence: number;   // -1 to 1
  arousal: number;   // -1 to 1
  perma_p: number;   // 1-10
  perma_e: number;
  perma_r: number;
  perma_m: number;
  perma_a: number;
  cognitive_load: number; // 1-10
  sentiment: string;
  created_at: string;
}

export interface ClinicalAssessment {
  id: string;
  type: "phq9" | "gad7";
  scores: number[];
  total_score: number;
  assessed_at: string;
}

export interface CorrelationInsight {
  id: string;
  content: string;
  chart_data: Record<string, unknown> | null;
  reaction: "makes_sense" | "surprising" | null;
  created_at: string;
}

export const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself down",
  "Trouble concentrating on things, such as reading or watching television",
  "Moving or speaking so slowly that other people could have noticed, or the opposite — being fidgety or restless",
  "Thoughts that you would be better off dead, or thoughts of hurting yourself",
];

export const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen",
];

export const SCORE_OPTIONS = [
  "Not at all",
  "Several days",
  "More than half the days",
  "Nearly every day",
];

export function phq9Severity(score: number): { label: string; color: string } {
  if (score <= 4) return { label: "Minimal", color: "#22c55e" };
  if (score <= 9) return { label: "Mild", color: "#eab308" };
  if (score <= 14) return { label: "Moderate", color: "#f97316" };
  if (score <= 19) return { label: "Moderately Severe", color: "#ef4444" };
  return { label: "Severe", color: "#dc2626" };
}

export function gad7Severity(score: number): { label: string; color: string } {
  if (score <= 4) return { label: "Minimal", color: "#22c55e" };
  if (score <= 9) return { label: "Mild", color: "#eab308" };
  if (score <= 14) return { label: "Moderate", color: "#f97316" };
  return { label: "Severe", color: "#ef4444" };
}
