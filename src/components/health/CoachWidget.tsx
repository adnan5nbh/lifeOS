"use client";

import { useState, useEffect } from "react";
import { DayLog, Goals } from "@/lib/health/types";

const SUGGESTIONS = [
  "Go for a walk",
  "Read for 15 minutes",
  "Drink some water",
  "Do some stretching",
  "Call a friend",
  "Step outside for fresh air",
  "Do a quick workout",
];

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "You don't have to be great to start, but you have to start to be great.",
  "Small steps every day lead to big changes over time.",
  "Discipline is choosing between what you want now and what you want most.",
  "Take care of your body — it's the only place you have to live.",
  "Progress, not perfection.",
  "Every day is a chance to be better than yesterday.",
  "Your future self is watching. Make them proud.",
  "The body achieves what the mind believes.",
  "Success is the sum of small efforts repeated daily.",
  "Motivation gets you going. Discipline keeps you going.",
  "Do something today that your future self will thank you for.",
  "Movement is medicine.",
  "You are one workout away from a good mood.",
  "Champions aren't made in gyms — they're made from stuff deep inside.",
  "The only bad workout is the one that didn't happen.",
  "Believe you can and you're halfway there.",
  "Rest when you're weary. Refresh and renew yourself.",
  "Consistency beats intensity.",
  "Your health is an investment, not an expense.",
];

function coachScore(
  log: DayLog,
  goals: Goals,
  emotionScore: number | null
): number {
  const stepsPct = Math.min(1, log.steps / goals.stepGoal);
  const emotionPct = emotionScore != null ? emotionScore / 10 : 0;
  const hasFood = log.food.length > 0 ? 1 : 0;
  const hasWorkout = log.exercises.length > 0 ? 1 : 0;
  return stepsPct * 0.25 + emotionPct * 0.35 + hasFood * 0.2 + hasWorkout * 0.2;
}

function emojiFor(score: number): string {
  if (score >= 0.65) return "😊";
  if (score >= 0.35) return "😐";
  return "😔";
}

interface Props {
  log: DayLog;
  goals: Goals;
  emotionScore: number | null;
}

export default function CoachWidget({ log, goals, emotionScore }: Props) {
  const [suggestion] = useState(() => SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [showQuote, setShowQuote] = useState(false);

  const score = coachScore(log, goals, emotionScore);
  const emoji = emojiFor(score);

  const [displayedEmoji, setDisplayedEmoji] = useState(emoji);
  useEffect(() => {
    setDisplayedEmoji(emoji);
  }, [emoji]);

  return (
    <section className="flex items-start gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
      {/* Animated face */}
      <div
        className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-4xl shadow-inner"
        style={{ transition: "all 0.5s ease" }}
        aria-label={`Coach mood: ${displayedEmoji}`}
      >
        {displayedEmoji}
      </div>

      {/* Speech bubble */}
      <button
        onClick={() => setShowQuote((v) => !v)}
        className="relative flex-1 cursor-pointer rounded-xl rounded-tl-none border border-slate-600 bg-slate-800 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-indigo-500"
        aria-label="Toggle between suggestion and quote"
      >
        <span className="absolute -left-2 top-3 border-8 border-transparent border-r-slate-600" />
        <span className="absolute -left-[7px] top-3 border-8 border-transparent border-r-slate-800" />
        <p className="leading-snug">{showQuote ? quote : suggestion}</p>
        <p className="mt-1 text-[10px] text-slate-500">
          {showQuote ? "Tap for a suggestion" : "Tap for a quote"}
        </p>
      </button>
    </section>
  );
}
