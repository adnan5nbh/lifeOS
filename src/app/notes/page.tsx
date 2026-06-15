import QuickNotesSection from "@/components/notes/QuickNotesSection";
import JournalSection from "@/components/notes/JournalSection";

export default function NotesPage() {
  return (
    <div className="flex flex-1 justify-center bg-slate-950">
      <main className="flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Notes & Journal</h1>
          <p className="text-sm text-slate-400">
            Jot down quick thoughts or write a longer journal entry. Start a note with{" "}
            <code className="rounded bg-slate-800 px-1">/analyse</code> to get AI feedback.
          </p>
        </div>

        <QuickNotesSection />
        <JournalSection />
      </main>
    </div>
  );
}
