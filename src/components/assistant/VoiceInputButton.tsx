"use client";

import { useRef, useState } from "react";

export default function VoiceInputButton({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const SpeechRecognitionCtor =
    typeof window !== "undefined" ? window.SpeechRecognition ?? window.webkitSpeechRecognition : undefined;

  if (!SpeechRecognitionCtor) {
    return (
      <button
        type="button"
        disabled
        title="Voice input not supported in this browser"
        className="rounded-lg px-2 py-2 text-slate-600"
      >
        🎤
      </button>
    );
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor!();
    recognition.lang = navigator.language;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onTranscript(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={listening ? "Stop recording" : "Record voice note"}
      className={`rounded-lg px-2 py-2 text-lg transition ${
        listening ? "bg-rose-500/20 text-rose-300" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      {listening ? "⏹" : "🎤"}
    </button>
  );
}
