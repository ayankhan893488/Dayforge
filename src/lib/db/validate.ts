import type { EntryRecord, MarkRecord } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const MAX_TEXT = 200;
const MAX_NOTES = 1000;
const MAX_VALUE = 24;

function num(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Trims, caps length and strips control characters from free-text input. */
function text(v: unknown, max = MAX_TEXT): string | undefined {
  if (typeof v !== "string") return undefined;
  // eslint-disable-next-line no-control-regex
  const clean = v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return clean || undefined;
}

function time(v: unknown): string | undefined {
  return typeof v === "string" && TIME_RE.test(v) ? v : undefined;
}

function clampValue(v: unknown) {
  return Math.min(MAX_VALUE, Math.max(0, num(v)));
}

/**
 * Normalises and validates a mark before it is written. Returns null for
 * records that can never be stored safely (bad/missing date), so a corrupt
 * import can never poison the database.
 */
export function validateMark(input: unknown): MarkRecord | null {
  const m = input as Partial<MarkRecord> | null;
  if (!m || typeof m.date !== "string" || !DATE_RE.test(m.date)) return null;
  const d = new Date(`${m.date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const status = m.status === "A" || m.status === "PN" || m.status === "P" ? m.status : "P";
  const now = Date.now();
  return {
    date: m.date,
    dayName: m.dayName || d.toLocaleDateString("en-US", { weekday: "short" }),
    month: m.month && m.month >= 1 && m.month <= 12 ? m.month : d.getMonth() + 1,
    year: m.year && m.year > 1970 ? m.year : d.getFullYear(),
    status,
    value: clampValue(m.value),
    nightShift: !!m.nightShift,
    present: m.present ?? (status === "P" || status === "PN"),
    createdAt: num(m.createdAt, now),
    updatedAt: num(m.updatedAt, now),
    syncedAt: m.syncedAt ?? null,
  };
}

export function validateEntry(input: unknown): EntryRecord | null {
  const e = input as Partial<EntryRecord> | null;
  if (!e || typeof e.date !== "string" || !DATE_RE.test(e.date)) return null;
  const now = Date.now();
  // Whitelist of known fields only — unknown/prototype keys can never be stored.
  const rec: EntryRecord = {
    id: typeof e.id === "string" && e.id ? e.id.slice(0, 64) : crypto.randomUUID(),
    date: e.date,
    value: clampValue(e.value),
    createdAt: num(e.createdAt, now),
    updatedAt: num(e.updatedAt, now),
    syncedAt: e.syncedAt ?? null,
  };
  const startTime = time(e.startTime);
  const endTime = time(e.endTime);
  if (startTime) rec.startTime = startTime;
  if (endTime) rec.endTime = endTime;
  if (e.hours !== undefined && Number.isFinite(Number(e.hours))) {
    rec.hours = Math.min(MAX_VALUE, Math.max(0, num(e.hours)));
  }
  const notes = text(e.notes, MAX_NOTES);
  const project = text(e.project);
  const site = text(e.site);
  const category = text(e.category);
  if (notes) rec.notes = notes;
  if (project) rec.project = project;
  if (site) rec.site = site;
  if (category) rec.category = category;
  return rec;
}

export const validMarks = (list: unknown[]) =>
  list.map(validateMark).filter((m): m is MarkRecord => m !== null);

export const validEntries = (list: unknown[]) =>
  list.map(validateEntry).filter((e): e is EntryRecord => e !== null);