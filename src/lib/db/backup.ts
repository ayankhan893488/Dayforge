import { getDb } from "./index";
import type { BackupFile, EntryRecord, MarkRecord } from "./types";
import { validEntries, validMarks } from "./validate";
import { formatDateTime12, formatTime12 } from "@/lib/dayforge-utils";

const BACKUP_VERSION = 1;
const AUTO_KEY = "dayforge-auto-backup";

export async function createBackup(): Promise<BackupFile> {
  const db = await getDb();
  const [marks, entries, settings] = await Promise.all([
    db.getAllMarks(),
    db.getAllEntries(),
    db.getSettings(),
  ]);
  return {
    format: "dayforge-backup",
    version: BACKUP_VERSION,
    createdAt: Date.now(),
    marks,
    entries,
    settings,
  };
}

export function parseBackup(text: string): BackupFile {
  const data = JSON.parse(text);
  if (data?.format !== "dayforge-backup" || !Array.isArray(data.marks)) {
    throw new Error("Not a valid DayForge backup file");
  }
  return {
    ...(data as BackupFile),
    marks: validMarks(data.marks),
    entries: validEntries(Array.isArray(data.entries) ? data.entries : []),
  };
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

export async function exportJson() {
  const backup = await createBackup();
  download(
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
    `dayforge-backup-${stamp()}.json`,
  );
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

/** Attendance-only CSV, spreadsheet friendly. */
export async function exportCsv() {
  const backup = await createBackup();
  const csv = toCsv(markRows(backup.marks));
  if (!csv) throw new Error("No attendance records to export yet");
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `dayforge-attendance-${stamp()}.csv`);
}

function markRows(marks: MarkRecord[]) {
  return [...marks]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({
      Date: m.date,
      Day: m.dayName,
      Month: m.month,
      Year: m.year,
      Status: m.status === "PN" ? "P+" : m.status,
      Value: m.value,
      "Night Shift": m.nightShift ? "Yes" : "No",
      Created: formatDateTime12(m.createdAt),
      Updated: formatDateTime12(m.updatedAt),
    }));
}

function entryRows(entries: EntryRecord[]) {
  return entries.map((e) => ({
    Date: e.date,
    Value: e.value,
    Start: formatTime12(e.startTime),
    End: formatTime12(e.endTime),
    Hours: e.hours ?? "",
    Project: e.project ?? "",
    Site: e.site ?? "",
    Category: e.category ?? "",
    Notes: e.notes ?? "",
  }));
}

export async function exportExcel() {
  const XLSX = await import("xlsx");
  const backup = await createBackup();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(markRows(backup.marks)), "Attendance");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(entryRows(backup.entries)), "Log Entries");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `dayforge-attendance-${stamp()}.xlsx`,
  );
}

export async function exportPdf(appName: string) {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const backup = await createBackup();
  const rows = markRows(backup.marks);
  const doc = new JsPDF();
  doc.setFontSize(16);
  doc.text(`${appName} — Attendance History`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated ${formatDateTime12(new Date())} · ${rows.length} records`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [["Date", "Day", "Status", "Value", "Night Shift"]],
    body: rows.map((r) => [r.Date, r.Day, r.Status, String(r.Value), r["Night Shift"]]),
    styles: { fontSize: 8 },
  });
  doc.save(`dayforge-attendance-${stamp()}.pdf`);
}

/** Automatic snapshot kept inside the database itself, refreshed at most daily. */
export async function autoBackup(force = false) {
  const db = await getDb();
  const settings = await db.getSettings();
  const last = (settings[`${AUTO_KEY}-at`] as number | undefined) ?? 0;
  if (!force && Date.now() - last < 24 * 60 * 60 * 1000) return;
  const backup = await createBackup();
  await db.putSettings({
    ...settings,
    [AUTO_KEY]: backup,
    [`${AUTO_KEY}-at`]: Date.now(),
  });
}

export async function getAutoBackup(): Promise<BackupFile | null> {
  const db = await getDb();
  const settings = await db.getSettings();
  return (settings[AUTO_KEY] as BackupFile | undefined) ?? null;
}

export async function getAutoBackupTime(): Promise<number | null> {
  const db = await getDb();
  const settings = await db.getSettings();
  return (settings[`${AUTO_KEY}-at`] as number | undefined) ?? null;
}