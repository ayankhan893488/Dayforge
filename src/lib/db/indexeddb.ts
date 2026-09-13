import type {
  AttendanceDatabase,
  EntryRecord,
  MarkRecord,
  SettingsRecord,
} from "./types";

const DB_NAME = "dayforge";
const DB_VERSION = 1;
const MARKS = "marks";
const ENTRIES = "entries";
const META = "meta";

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export class IndexedDbDatabase implements AttendanceDatabase {
  readonly engine = "indexeddb" as const;
  private db: IDBDatabase | null = null;

  async init() {
    if (this.db) return;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, DB_VERSION);
      open.onupgradeneeded = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains(MARKS)) {
          const s = db.createObjectStore(MARKS, { keyPath: "date" });
          s.createIndex("by_year_month", ["year", "month"]);
          s.createIndex("by_status", "status");
        }
        if (!db.objectStoreNames.contains(ENTRIES)) {
          const s = db.createObjectStore(ENTRIES, { keyPath: "id" });
          s.createIndex("by_date", "date");
        }
        if (!db.objectStoreNames.contains(META)) {
          db.createObjectStore(META, { keyPath: "key" });
        }
      };
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
  }

  /** Reopens the connection if the browser closed it (tab suspend, storage reclaim). */
  private async ensureOpen() {
    if (this.db) return;
    await this.init();
  }

  /** Runs a DB operation, transparently reopening once on a closed connection. */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureOpen();
    try {
      return await fn();
    } catch (err) {
      console.warn("[dayforge] db op failed, reopening", err);
      this.db?.close();
      this.db = null;
      await this.init();
      return await fn();
    }
  }

  private store(name: string, mode: IDBTransactionMode) {
    if (!this.db) throw new Error("Database not initialised");
    this.db.onclose = () => {
      this.db = null;
    };
    return this.db.transaction(name, mode).objectStore(name);
  }

  async getAllMarks() {
    return this.withRetry(() => req<MarkRecord[]>(this.store(MARKS, "readonly").getAll()));
  }

  async putMark(record: MarkRecord) {
    await this.withRetry(async () => {
      const s = this.store(MARKS, "readwrite");
      s.put(record);
      await done(s.transaction);
    });
  }

  async deleteMark(date: string) {
    await this.withRetry(async () => {
      const s = this.store(MARKS, "readwrite");
      s.delete(date);
      await done(s.transaction);
    });
  }

  async getAllEntries() {
    return this.withRetry(() => req<EntryRecord[]>(this.store(ENTRIES, "readonly").getAll()));
  }

  async putEntry(record: EntryRecord) {
    await this.withRetry(async () => {
      const s = this.store(ENTRIES, "readwrite");
      s.put(record);
      await done(s.transaction);
    });
  }

  async deleteEntry(id: string) {
    await this.withRetry(async () => {
      const s = this.store(ENTRIES, "readwrite");
      s.delete(id);
      await done(s.transaction);
    });
  }

  async getSettings() {
    const row = await this.withRetry(() =>
      req<{ key: string; value: SettingsRecord } | undefined>(
        this.store(META, "readonly").get("settings"),
      ),
    );
    return row?.value ?? {};
  }

  async putSettings(settings: SettingsRecord) {
    await this.withRetry(async () => {
      const s = this.store(META, "readwrite");
      s.put({ key: "settings", value: settings });
      await done(s.transaction);
    });
  }

  async replaceAll(marks: MarkRecord[], entries: EntryRecord[]) {
    await this.withRetry(async () => {
      if (!this.db) throw new Error("Database not initialised");
      const tx = this.db.transaction([MARKS, ENTRIES], "readwrite");
      const m = tx.objectStore(MARKS);
      const e = tx.objectStore(ENTRIES);
      m.clear();
      e.clear();
      for (const r of marks) m.put(r);
      for (const r of entries) e.put(r);
      await done(tx);
    });
  }

  async clearRecords() {
    await this.replaceAll([], []);
  }
}