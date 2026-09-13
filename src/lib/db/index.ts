import type { AttendanceDatabase, EntryRecord, MarkRecord, SettingsRecord } from "./types";

export * from "./types";

/** In-memory fallback so SSR / unsupported browsers never crash. */
class MemoryDatabase implements AttendanceDatabase {
  readonly engine = "memory" as const;
  private marks = new Map<string, MarkRecord>();
  private entries = new Map<string, EntryRecord>();
  private settings: SettingsRecord = {};
  async init() {}
  async getAllMarks() { return [...this.marks.values()]; }
  async putMark(r: MarkRecord) { this.marks.set(r.date, r); }
  async deleteMark(date: string) { this.marks.delete(date); }
  async getAllEntries() { return [...this.entries.values()]; }
  async putEntry(r: EntryRecord) { this.entries.set(r.id, r); }
  async deleteEntry(id: string) { this.entries.delete(id); }
  async getSettings() { return this.settings; }
  async putSettings(s: SettingsRecord) { this.settings = s; }
  async replaceAll(marks: MarkRecord[], entries: EntryRecord[]) {
    this.marks = new Map(marks.map((m) => [m.date, m]));
    this.entries = new Map(entries.map((e) => [e.id, e]));
  }
  async clearRecords() { this.marks.clear(); this.entries.clear(); }
}

function isNativeAndroid() {
  const cap = (globalThis as any).Capacitor;
  return !!cap?.isNativePlatform?.() && cap.getPlatform?.() !== "web";
}

let dbPromise: Promise<AttendanceDatabase> | null = null;

/** Picks SQLite on Capacitor/Android, IndexedDB on the web, memory as fallback. */
export function getDb(): Promise<AttendanceDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      if (typeof window !== "undefined") {
        if (isNativeAndroid()) {
          try {
            const { SqliteDatabase } = await import("./sqlite");
            const db = new SqliteDatabase();
            await db.init();
            return db as AttendanceDatabase;
          } catch (err) {
            console.warn("[dayforge] SQLite unavailable, falling back", err);
          }
        }
        if ("indexedDB" in window) {
          try {
            const { IndexedDbDatabase } = await import("./indexeddb");
            const db = new IndexedDbDatabase();
            await db.init();
            return db as AttendanceDatabase;
          } catch (err) {
            console.warn("[dayforge] IndexedDB unavailable, falling back", err);
          }
        }
      }
      const mem = new MemoryDatabase();
      await mem.init();
      return mem;
    })();
  }
  return dbPromise;
}