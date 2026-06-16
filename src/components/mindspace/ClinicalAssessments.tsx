"use client";

import { useState } from "react";
import {
  ClinicalAssessment, PHQ9_QUESTIONS, GAD7_QUESTIONS, SCORE_OPTIONS,
  phq9Severity, gad7Severity,
} from "@/lib/mindspace/types";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  assessments: ClinicalAssessment[];
  isDue: (type: "phq9" | "gad7") => boolean;
  onSave: (type: "phq9" | "gad7", scores: number[]) => Promise<unknown>;
}

function AssessmentForm({ type, questions, onSave, onCancel }: {
  type: "phq9" | "gad7";
  questions: readonly string[];
  onSave: (type: "phq9" | "gad7", scores: number[]) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [scores, setScores] = useState<number[]>(new Array(questions.length).fill(-1));
  const [saving, setSaving] = useState(false);
  const total = scores.every(s => s >= 0) ? scores.reduce((a, b) => a + b, 0) : null;
  const severity = total !== null ? (type === "phq9" ? phq9Severity(total) : gad7Severity(total)) : null;

  async function submit() {
    if (scores.some(s => s < 0)) return;
    setSaving(true);
    await onSave(type, scores);
    setSaving(false);
    onCancel();
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{type.toUpperCase()} Assessment</h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
      </div>
      <p className="mb-3 text-[11px] text-slate-500">Over the last 2 weeks, how often have you been bothered by the following?</p>

      <div className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <div key={i}>
            <p className="mb-1.5 text-xs text-slate-300">{i + 1}. {q}</p>
            <div className="grid grid-cols-2 gap-1">
              {SCORE_OPTIONS.map((opt, s) => (
                <button
                  key={s}
                  onClick={() => setScores(prev => { const n = [...prev]; n[i] = s; return n; })}
                  className="rounded-lg border px-2 py-1.5 text-[11px] text-left transition"
                  style={{
                    borderColor: scores[i] === s ? "#6366f1" : "#334155",
                    background: scores[i] === s ? "#6366f120" : "transparent",
                    color: scores[i] === s ? "#a5b4fc" : "#94a3b8",
                  }}
                >
                  {s} – {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {total !== null && severity && (
        <div className="mt-4 rounded-lg border p-3" style={{ borderColor: severity.color + "44", background: severity.color + "11" }}>
          <p className="text-xs font-semibold" style={{ color: severity.color }}>Score: {total} — {severity.label}</p>
        </div>
      )}

      <p className="mt-3 text-[10px] text-slate-600">
        ⚠️ For self-tracking only. This is not a medical diagnosis. If you are struggling, please speak to a qualified mental health professional.
      </p>
      <button
        onClick={submit}
        disabled={saving || scores.some(s => s < 0)}
        className="mt-3 w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-40 transition"
      >
        {saving ? "Saving…" : "Submit Assessment"}
      </button>
    </div>
  );
}

export default function ClinicalAssessments({ assessments, isDue, onSave }: Props) {
  const [activeForm, setActiveForm] = useState<"phq9" | "gad7" | null>(null);

  if (activeForm) {
    return (
      <AssessmentForm
        type={activeForm}
        questions={activeForm === "phq9" ? PHQ9_QUESTIONS : GAD7_QUESTIONS}
        onSave={onSave}
        onCancel={() => setActiveForm(null)}
      />
    );
  }

  function renderCard(type: "phq9" | "gad7") {
    const history = assessments.filter(a => a.type === type).slice(0, 8).reverse();
    const last = assessments.find(a => a.type === type);
    const sev = last ? (type === "phq9" ? phq9Severity(last.total_score) : gad7Severity(last.total_score)) : null;
    const due = isDue(type);

    return (
      <div key={type} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{type.toUpperCase()}</h3>
            <p className="text-[11px] text-slate-500">
              {type === "phq9" ? "Depression screen (0–27)" : "Anxiety screen (0–21)"}
            </p>
          </div>
          {due ? (
            <button
              onClick={() => setActiveForm(type)}
              className="rounded-lg bg-indigo-500/20 px-3 py-1 text-xs text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30"
            >
              Take now
            </button>
          ) : (
            <button
              onClick={() => setActiveForm(type)}
              className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800"
            >
              Retake
            </button>
          )}
        </div>

        {last && sev && (
          <div className="mb-3">
            <span className="text-xs font-medium" style={{ color: sev.color }}>{sev.label}</span>
            <span className="ml-2 text-xs text-slate-500">score {last.total_score}</span>
          </div>
        )}

        {history.length > 1 && (
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={history.map(a => ({ score: a.total_score, date: a.assessed_at.slice(0, 10) }))}>
              <XAxis dataKey="date" hide />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "none", fontSize: 11 }}
                formatter={(v) => [v, "Score"]}
              />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {!last && (
          <p className="text-[11px] text-slate-600">No assessments yet. Weekly check-ins recommended.</p>
        )}

        <p className="mt-2 text-[10px] text-slate-600">
          ⚠️ For self-tracking only — not a medical diagnosis.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-200">Weekly Clinical Assessments</h2>
      {renderCard("phq9")}
      {renderCard("gad7")}
    </div>
  );
}
