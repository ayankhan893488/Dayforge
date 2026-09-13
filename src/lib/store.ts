import { create } from "zustand";
import { get as idbGet, del as idbDel } from "idb-keyval";
import { getDb } from "./db";
import type { EntryRecord, MarkRecord, MarkStatus } from "./db/types";
import { validateEntry, validateMark, validEntries, validMarks } from "./db/validate";

export type AttendanceEntry = EntryRecord;

export type ThemeKey =
  | "coffee"
  | "hacker"
  | "midnight"
  | "emerald"
  | "royal"
  | "sunset"
  | "arctic";

export type { MarkStatus };
export type AttendanceMark = MarkRecord;

export type Lang = "en" | "hi";
export type WelcomeAnimation =
  | "fade"
  | "slide"
  | "zoom"
  | "glass"
  | "gradient"
  | "neon"
  | "minimal"
  | "premium"
  | "particles"
  | "splash"
  | "none";

/** Present and Night Shift are independent flags. */
export function markFlags(m?: AttendanceMark | null) {
  if (!m) return { present: false, night: false, absent: false };
  if (m.status === "A") return { present: false, night: false, absent: true };
  return {
    present: m.present ?? (m.status === "P" || m.status === "PN"),
    night: m.nightShift ?? m.status === "PN",
    absent: false,
  };
}

function computeValue(present: boolean, night: boolean, dayValue: number, nightValue: number) {
  if (!present && !night) return 0;
  return night ? nightValue : dayValue;
}

type State = {
  hydrated: boolean;
  hasLaunched: boolean;
  appName: string;
  userName: string;
  theme: ThemeKey;
  currency: string;
  ratePerDay: number;
  entries: AttendanceEntry[];
  defaultDailyValue: number;
  nightShiftValue: number;
  marks: Record<string, AttendanceMark>;
  language: Lang;
  greetingText: string;
  welcomeMessage: string;
  welcomeAnimation: WelcomeAnimation;
  showWelcome: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  setReminderEnabled: (v: boolean) => void;
  setReminderTime: (t: string) => void;
  setLanguage: (l: Lang) => void;
  setGreetingText: (t: string) => void;
  setWelcomeMessage: (t: string) => void;
  setWelcomeAnimation: (a: WelcomeAnimation) => void;
  setShowWelcome: (v: boolean) => void;
  togglePresent: (date: string) => void;
  toggleNightShift: (date: string) => void;
  toggleAbsent: (date: string) => void;
  setDefaultDailyValue: (n: number) => void;
  setNightShiftValue: (n: number) => void;
  setMark: (date: string, status: MarkStatus) => void;
  clearMark: (date: string) => void;
  setHasLaunched: (v: boolean) => void;
  setAppName: (n: string) => void;
  setUserName: (n: string) => void;
  setTheme: (t: ThemeKey) => void;
  setCurrency: (c: string) => void;
  setRatePerDay: (n: number) => void;
  addEntry: (e: Omit<AttendanceEntry, "id" | "createdAt">) => void;
  updateEntry: (id: string, patch: Partial<AttendanceEntry>) => void;
  deleteEntry: (id: string) => void;
  duplicateEntry: (id: string) => void;
  resetAll: () => void;
  hydrate: () => Promise<void>;
  restore: (data: { marks?: MarkRecord[]; entries?: EntryRecord[]; settings?: Record<string, unknown> }, mode?: "replace" | "merge") => Promise<void>;
};

const SETTING_KEYS = [
  "hasLaunched",
  "appName",
  "userName",
  "theme",
  "currency",
  "ratePerDay",
  "defaultDailyValue",
  "nightShiftValue",
  "language",
  "greetingText",
  "welcomeMessage",
  "welcomeAnimation",
  "showWelcome",
  "reminderEnabled",
  "reminderTime",
] as const;

type Settings = Pick<State, (typeof SETTING_KEYS)[number]>;

function pickSettings(s: State): Settings {
  return Object.fromEntries(SETTING_KEYS.map((k) => [k, s[k]])) as Settings;
}

export const useStore = create<State>()((set, get) => {
  // Every write goes through one serial queue: no interleaved transactions,
  // no lost updates, and a failing write can never break the next one.
  let queue: Promise<unknown> = Promise.resolve();
  const write = (fn: (db: Awaited<ReturnType<typeof getDb>>) => Promise<void>) => {
    queue = queue
      .then(() => getDb())
      .then(fn)
      .catch((e) => console.error("[dayforge] write failed", e));
    return queue;
  };
  const persistSettings = () => write((db) => db.putSettings(pickSettings(get())));
  const setSetting = (patch: Partial<State>) => {
    set(patch as never);
    persistSettings();
  };

  /** Single source of truth for writing one date's record. One row per date. */
  const writeFlags = (
    date: string,
    flags: { present: boolean; night: boolean },
    absent = false,
  ) => {
    const state = get();
    if (!absent && !flags.present && !flags.night) {
      const next = { ...state.marks };
      delete next[date];
      set({ marks: next });
      write((db) => db.deleteMark(date));
      return;
    }
    const d = new Date(`${date}T00:00:00`);
    const prev = state.marks[date];
    const now = Date.now();
    const draft: AttendanceMark = {
      date,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      status: absent ? "A" : flags.night ? "PN" : "P",
      value: absent
        ? 0
        : computeValue(flags.present, flags.night, state.defaultDailyValue, state.nightShiftValue),
      present: absent ? false : flags.present,
      nightShift: absent ? false : flags.night,
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
      syncedAt: prev?.syncedAt ?? null,
    };
    // Validate before it ever reaches the database — corrupt rows are dropped, not stored.
    const mark = validateMark(draft);
    if (!mark) {
      console.error("[dayforge] refused to save an invalid record", draft);
      return;
    }
    set({ marks: { ...state.marks, [date]: mark } });
    write((db) => db.putMark(mark));
  };

  return {
      hydrated: false,
      hasLaunched: false,
      appName: "DayForge",
      userName: "Ayan",
      theme: "coffee",
      currency: "₹",
      ratePerDay: 1000,
      entries: [],
      defaultDailyValue: 1.5,
      nightShiftValue: 2,
      marks: {},
      language: "en" as Lang,
      greetingText: "Hello",
      welcomeMessage: "Let's forge a productive day.",
      welcomeAnimation: "slide" as WelcomeAnimation,
      showWelcome: true,
      reminderEnabled: false,
      reminderTime: "19:00",
      setReminderEnabled: (v) => setSetting({ reminderEnabled: v }),
      setReminderTime: (t) => setSetting({ reminderTime: t }),
      setLanguage: (l) => setSetting({ language: l }),
      setGreetingText: (t) => setSetting({ greetingText: t }),
      setWelcomeMessage: (t) => setSetting({ welcomeMessage: t }),
      setWelcomeAnimation: (a) => setSetting({ welcomeAnimation: a }),
      setShowWelcome: (v) => setSetting({ showWelcome: v }),
      setDefaultDailyValue: (n) => setSetting({ defaultDailyValue: n }),
      setNightShiftValue: (n) => setSetting({ nightShiftValue: n }),
      togglePresent: (date) => {
        const f = markFlags(get().marks[date]);
        // Turning Present off also removes the night shift (it can't stand alone).
        writeFlags(date, f.present ? { present: false, night: false } : { present: true, night: f.night });
      },
      toggleNightShift: (date) => {
        const f = markFlags(get().marks[date]);
        // A night shift always implies a normal workday, so Present is auto-enabled.
        writeFlags(date, f.night ? { present: f.present, night: false } : { present: true, night: true });
      },
      toggleAbsent: (date) => {
        const f = markFlags(get().marks[date]);
        if (f.absent) writeFlags(date, { present: false, night: false });
        else writeFlags(date, { present: false, night: false }, true);
      },
      setMark: (date, status) => {
        if (status === "A") writeFlags(date, { present: false, night: false }, true);
        else writeFlags(date, { present: true, night: status === "PN" });
      },
      clearMark: (date) => {
        const next = { ...get().marks };
        delete next[date];
        set({ marks: next });
        write((db) => db.deleteMark(date));
      },
      setHasLaunched: (v) => setSetting({ hasLaunched: v }),
      setAppName: (n) => setSetting({ appName: n || "DayForge" }),
      setUserName: (n) => setSetting({ userName: n || "You" }),
      setTheme: (t) => setSetting({ theme: t }),
      setCurrency: (c) => setSetting({ currency: c }),
      setRatePerDay: (n) => setSetting({ ratePerDay: n }),
      addEntry: (e) => {
        const now = Date.now();
        const rec = validateEntry({ ...e, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
        if (!rec) return;
        set({ entries: [...get().entries, rec] });
        write((db) => db.putEntry(rec));
      },
      updateEntry: (id, patch) => {
        const prev = get().entries.find((x) => x.id === id);
        if (!prev) return;
        const next = validateEntry({ ...prev, ...patch, updatedAt: Date.now() });
        if (!next) return;
        set({ entries: get().entries.map((x) => (x.id === id ? next : x)) });
        write((db) => db.putEntry(next));
      },
      deleteEntry: (id) => {
        set({ entries: get().entries.filter((x) => x.id !== id) });
        write((db) => db.deleteEntry(id));
      },
      duplicateEntry: (id) => {
        const src = get().entries.find((x) => x.id === id);
        if (!src) return;
        const now = Date.now();
        const rec = validateEntry({ ...src, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
        if (!rec) return;
        set({ entries: [...get().entries, rec] });
        write((db) => db.putEntry(rec));
      },
      resetAll: () => {
        set({ entries: [], marks: {}, appName: "DayForge", userName: "Ayan", theme: "coffee" });
        persistSettings();
        write((db) => db.clearRecords());
      },
      hydrate: async () => {
        if (get().hydrated) return;
        // Guard against concurrent callers (StrictMode, remounts) hydrating twice.
        hydratePromise ??= (async () => {
          try {
            const db = await getDb();
            await migrateLegacyStore(db);
            const [marks, entries, settings] = await Promise.all([
              db.getAllMarks(),
              db.getAllEntries(),
              db.getSettings(),
            ]);
            set({
              ...(settings as Partial<State>),
              marks: Object.fromEntries(marks.map((m) => [m.date, m])),
              entries: entries.sort((a, b) => a.date.localeCompare(b.date)),
              hydrated: true,
            });
          } catch (err) {
            console.error("[dayforge] hydrate failed", err);
            hydratePromise = null;
            // Never block the UI on a storage failure.
            set({ hydrated: true });
          }
        })();
        await hydratePromise;
      },
      restore: async (data, mode = "replace") => {
        const db = await getDb();
        await queue.catch(() => {});
        const currentMarks = mode === "merge" ? Object.values(get().marks) : [];
        const currentEntries = mode === "merge" ? get().entries : [];
        const markMap = new Map<string, MarkRecord>(currentMarks.map((m) => [m.date, m]));
        for (const m of validMarks(data.marks ?? [])) {
          const existing = markMap.get(m.date);
          if (!existing || (m.updatedAt ?? 0) >= (existing.updatedAt ?? 0)) markMap.set(m.date, m);
        }
        const entryMap = new Map<string, EntryRecord>(currentEntries.map((e) => [e.id, e]));
        for (const e of validEntries(data.entries ?? [])) entryMap.set(e.id, e);
        const marks = [...markMap.values()];
        const entries = [...entryMap.values()].sort((a, b) => a.date.localeCompare(b.date));
        await db.replaceAll(marks, entries);
        set({
          ...(data.settings as Partial<State> | undefined),
          marks: Object.fromEntries(marks.map((m) => [m.date, m])),
          entries,
        });
        await db.putSettings(pickSettings(get()));
      },
  };
});

let hydratePromise: Promise<void> | null = null;

/** One-time migration from the old zustand/idb-keyval blob into the record DB. */
async function migrateLegacyStore(db: Awaited<ReturnType<typeof getDb>>) {
  try {
    const raw = await idbGet("dayforge-store");
    if (!raw) return;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const s = parsed?.state ?? {};
    const now = Date.now();
    const marks: MarkRecord[] = Object.values(s.marks ?? {}).map((m: any) => ({
      ...m,
      nightShift: m.status === "PN",
      createdAt: m.createdAt ?? m.updatedAt ?? now,
      updatedAt: m.updatedAt ?? now,
    }));
    const entries: EntryRecord[] = (s.entries ?? []).map((e: any) => ({
      ...e,
      updatedAt: e.updatedAt ?? e.createdAt ?? now,
    }));
    const existing = await db.getAllMarks();
    const existingEntries = await db.getAllEntries();
    const markMap = new Map(existing.map((m) => [m.date, m]));
    for (const m of marks) if (!markMap.has(m.date)) markMap.set(m.date, m);
    const entryMap = new Map(existingEntries.map((e) => [e.id, e]));
    for (const e of entries) if (!entryMap.has(e.id)) entryMap.set(e.id, e);
    await db.replaceAll([...markMap.values()], [...entryMap.values()]);
    const current = await db.getSettings();
    const legacySettings = Object.fromEntries(
      SETTING_KEYS.filter((k) => s[k] !== undefined).map((k) => [k, s[k]]),
    );
    await db.putSettings({ ...legacySettings, ...current });
    await idbDel("dayforge-store");
  } catch (err) {
    console.warn("[dayforge] legacy migration skipped", err);
  }
}