import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInCalendarDays } from "date-fns";
import type { AttendanceEntry } from "./store";

export const todayStr = () => format(new Date(), "yyyy-MM-dd");

/** "14:06" -> "2:06 PM". Returns "" for missing/invalid input. */
export function formatTime12(hhmm?: string | null): string {
  if (!hhmm) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return hhmm;
  const h = Number(m[1]);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${suffix}`;
}

/** Full date + 12-hour time, e.g. "06 Aug 2026, 2:06 PM". */
export function formatDateTime12(d: Date | number | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "dd MMM yyyy, h:mm a");
}

export function sumValue(entries: AttendanceEntry[], from: Date, to: Date) {
  return entries
    .filter((e) => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start: from, end: to });
    })
    .reduce((a, b) => a + (b.value || 0), 0);
}

export function todayTotal(entries: AttendanceEntry[]) {
  const t = todayStr();
  return entries.filter((e) => e.date === t).reduce((a, b) => a + b.value, 0);
}

export function weeklyTotal(entries: AttendanceEntry[]) {
  const now = new Date();
  return sumValue(entries, startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }));
}

export function monthlyTotal(entries: AttendanceEntry[]) {
  const now = new Date();
  return sumValue(entries, startOfMonth(now), endOfMonth(now));
}

export function totalHours(entries: AttendanceEntry[]) {
  return entries.reduce((a, b) => a + (b.hours || 0), 0);
}

export function streaks(entries: AttendanceEntry[]) {
  const dates = Array.from(new Set(entries.map((e) => e.date))).sort();
  if (dates.length === 0) return { current: 0, longest: 0 };
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(parseISO(dates[i]), parseISO(dates[i - 1]));
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  // current streak counting back from today
  let current = 0;
  let cursor = new Date();
  const set = new Set(dates);
  while (set.has(format(cursor, "yyyy-MM-dd"))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, longest };
}

export function valueColor(value: number) {
  if (value >= 2) return "bg-[oklch(0.55_0.2_300)]"; // 2 day - purple
  if (value >= 1.5) return "bg-[oklch(0.6_0.18_240)]"; // 1.5 - blue
  if (value >= 1) return "bg-[oklch(0.7_0.2_145)]"; // full - green
  if (value >= 0.25) return "bg-[oklch(0.8_0.18_85)]"; // half - yellow
  return "bg-[oklch(0.65_0.22_25)]"; // red
}

export function valueLabel(v: number) {
  if (v >= 2) return "2 Day";
  if (v >= 1.75) return "1.75 Day";
  if (v >= 1.5) return "1.5 Day";
  if (v >= 1.25) return "1.25 Day";
  if (v >= 1) return "Full Day";
  if (v >= 0.75) return "0.75 Day";
  if (v >= 0.5) return "Half Day";
  if (v >= 0.25) return "Quarter";
  return "None";
}