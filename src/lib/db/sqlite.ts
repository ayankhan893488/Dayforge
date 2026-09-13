import type {
  AttendanceDatabase,
  EntryRecord,
  MarkRecord,
  SettingsRecord,
} from "./types";

/**
 * SQLite engine used when the app is packaged as an Android APK with Capacitor
 * (@capacitor-community/sqlite). Record shapes match the IndexedDB engine
 * exactly, so the same attendance data works on both platforms.
 */
export class SqliteDatabase implements AttendanceDatabase {
  readonly engine = "sqlite" as const;
  private db: any = null;

  async init() {
    if (this.db) return;
    const moduleName = "@capacitor-community/sqlite";
    const mod: any = await import(/* @vite-ignore */ moduleName);
    const connection = new mod.SQLiteConnection(mod.CapacitorSQLite);
    const existing = await connection.isConnection("dayforge", false);
    this.db = existing.result
      ? await connection.retrieveConnection("dayforge", false)
      : await connection.createConnection("dayforge", false, "no-encryption", 1, false);
    await this.db.open();
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS marks (
        date TEXT PRIMARY KEY NOT NULL,
        dayName TEXT NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        status TEXT NOT NULL,
        value REAL NOT NULL,
        nightShift INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        syncedAt INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_marks_year_month ON marks (year, month);
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        date TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_entries_date ON entries (date);
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }

  async getAllMarks(): Promise<MarkRecord[]> {
    const res = await this.db.query("SELECT * FROM marks ORDER BY date ASC;");
    return (res.values ?? []).map((r: any) => ({
      ...r,
      nightShift: !!r.nightShift,
    }));
  }

  async putMark(r: MarkRecord) {
    await this.db.run(
      `INSERT INTO marks (date, dayName, month, year, status, value, nightShift, createdAt, updatedAt, syncedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(date) DO UPDATE SET
         dayName=excluded.dayName, month=excluded.month, year=excluded.year,
         status=excluded.status, value=excluded.value, nightShift=excluded.nightShift,
         updatedAt=excluded.updatedAt, syncedAt=excluded.syncedAt;`,
      [r.date, r.dayName, r.month, r.year, r.status, r.value, r.nightShift ? 1 : 0, r.createdAt, r.updatedAt, r.syncedAt ?? null],
    );
  }

  async deleteMark(date: string) {
    await this.db.run("DELETE FROM marks WHERE date = ?;", [date]);
  }

  async getAllEntries(): Promise<EntryRecord[]> {
    const res = await this.db.query("SELECT payload FROM entries ORDER BY date ASC;");
    return (res.values ?? []).map((r: any) => JSON.parse(r.payload) as EntryRecord);
  }

  async putEntry(r: EntryRecord) {
    await this.db.run(
      `INSERT INTO entries (id, payload, date, createdAt, updatedAt) VALUES (?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, date=excluded.date, updatedAt=excluded.updatedAt;`,
      [r.id, JSON.stringify(r), r.date, r.createdAt, r.updatedAt ?? r.createdAt],
    );
  }

  async deleteEntry(id: string) {
    await this.db.run("DELETE FROM entries WHERE id = ?;", [id]);
  }

  async getSettings(): Promise<SettingsRecord> {
    const res = await this.db.query("SELECT value FROM meta WHERE key = 'settings';");
    const row = res.values?.[0];
    return row ? (JSON.parse(row.value) as SettingsRecord) : {};
  }

  async putSettings(settings: SettingsRecord) {
    await this.db.run(
      `INSERT INTO meta (key, value) VALUES ('settings', ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value;`,
      [JSON.stringify(settings)],
    );
  }

  async replaceAll(marks: MarkRecord[], entries: EntryRecord[]) {
    await this.db.execute("DELETE FROM marks; DELETE FROM entries;");
    for (const m of marks) await this.putMark(m);
    for (const e of entries) await this.putEntry(e);
  }

  async clearRecords() {
    await this.db.execute("DELETE FROM marks; DELETE FROM entries;");
  }
}