export interface QuickNote {
  id: string;
  content: string;
  aiAnalysis?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  aiAnalysis?: string;
  createdAt: string;
  updatedAt: string;
}
