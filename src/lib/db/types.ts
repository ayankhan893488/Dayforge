export type MarkStatus = "P" | "PN" | "A";

/** One permanent attendance record — one row per calendar date. */
export type MarkRecord = {
  date: string; // yyyy-MM-dd — primary key, guarantees no duplicates
  dayName: string;
  month: number; // 1-12
  year: number;
  status: MarkStatus;
  value: number; // 1.5 / 2.0 / 0 / custom
  nightShift: boolean;
  /** Independent normal-workday flag. Derived from status for legacy rows. */
  present?: boolean;
  createdAt: number;
  updatedAt: number;
  /** reserved for future Supabase/Firebase sync — never remove */
  syncedAt?: number | null;
  deleted?: boolean;
};

export type EntryRecord = {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hours?: number;
  value: number;
  notes?: string;
  project?: string;
  site?: string;
  category?: string;
  createdAt: number;
  updatedAt?: number;
  syncedAt?: number | null;
};

export type SettingsRecord = Record<string, unknown>;

export type BackupFile = {
  format: "dayforge-backup";
  version: number;
  createdAt: number;
  marks: MarkRecord[];
  entries: EntryRecord[];
  settings: SettingsRecord;
};

/**
 * Storage-engine contract. IndexedDB backs the web app; SQLite backs the
 * Capacitor Android build. Records are identical on both.
 */
export interface AttendanceDatabase {
  readonly engine: "indexeddb" | "sqlite" | "memory";
  init(): Promise<void>;
  getAllMarks(): Promise<MarkRecord[]>;
  putMark(record: MarkRecord): Promise<void>;
  deleteMark(date: string): Promise<void>;
  getAllEntries(): Promise<EntryRecord[]>;
  putEntry(record: EntryRecord): Promise<void>;
  deleteEntry(id: string): Promise<void>;
  getSettings(): Promise<SettingsRecord>;
  putSettings(settings: SettingsRecord): Promise<void>;
  replaceAll(marks: MarkRecord[], entries: EntryRecord[]): Promise<void>;
  clearRecords(): Promise<void>;
}