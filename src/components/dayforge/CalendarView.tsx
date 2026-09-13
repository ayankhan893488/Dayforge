import { useState, useMemo, useDeferredValue } from "react";
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Search, Edit3, Trash2, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { valueColor, valueLabel, formatTime12 } from "@/lib/dayforge-utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AttendanceDialog } from "./AttendanceDialog";
import { MonthlyChart } from "./MonthlyChart";
import type { AttendanceEntry } from "@/lib/store";

export function CalendarView() {
  const entries = useStore((s) => s.entries);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const duplicateEntry = useStore((s) => s.duplicateEntry);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [editing, setEditing] = useState<AttendanceEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const byDate = useMemo(() => {
    const m = new Map<string, AttendanceEntry[]>();
    for (const e of entries) {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date)!.push(e);
    }
    return m;
  }, [entries]);

  const selectedEntries = selected
    ? (byDate.get(format(selected, "yyyy-MM-dd")) || [])
    : [];

  const searchResults = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) return [];
    return entries.filter((e) =>
      [e.notes, e.project, e.site, e.category, e.date]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [entries, deferredQuery]);

  return (
    <div className="p-5 pb-28 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Calendar</h1>

      <MonthlyChart />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search attendance..." className="pl-9" />
      </div>

      {query && (
        <div className="rounded-2xl border bg-card p-3 space-y-2">
          {searchResults.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No results</div>
          ) : (
            searchResults.slice(0, 20).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{format(parseISO(e.date), "dd MMM yyyy")}</div>
                  <div className="text-xs text-muted-foreground">{e.notes || e.project || e.category}</div>
                </div>
                <div className="text-sm font-semibold">{e.value}</div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-lg hover:bg-accent">
            <ChevronLeft size={18} />
          </button>
          <div className="text-base font-semibold">{format(month, "MMMM yyyy")}</div>
          <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-lg hover:bg-accent">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const dayEntries = byDate.get(key);
            const total = dayEntries?.reduce((a, b) => a + b.value, 0) || 0;
            const inMonth = isSameMonth(d, month);
            const isSel = selected && isSameDay(d, selected);
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelected(d)}
                className={`aspect-square rounded-lg text-xs relative flex flex-col items-center justify-center transition-colors ${
                  isSel ? "ring-2 ring-primary" : ""
                } ${inMonth ? "bg-secondary/40" : "opacity-40"}`}
              >
                <span className={`${total > 0 ? "font-semibold" : ""}`}>{format(d, "d")}</span>
                {total > 0 && (
                  <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${valueColor(total)}`} />
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <LegendDot color="bg-[oklch(0.7_0.2_145)]" label="Full Day" />
          <LegendDot color="bg-[oklch(0.6_0.18_240)]" label="1.5 Day" />
          <LegendDot color="bg-[oklch(0.55_0.2_300)]" label="2 Day" />
          <LegendDot color="bg-[oklch(0.8_0.18_85)]" label="Half Day" />
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected && format(selected, "EEEE, dd MMM yyyy")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedEntries.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">No attendance recorded.</div>
            )}
            <AnimatePresence>
              {selectedEntries.map((e) => (
                <motion.div key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{valueLabel(e.value)} · {e.value}</div>
                      {(e.startTime || e.endTime) && (
                        <div className="text-xs text-muted-foreground">{formatTime12(e.startTime)} – {formatTime12(e.endTime)} {e.hours ? `(${e.hours.toFixed(1)}h)` : ""}</div>
                      )}
                      {e.project && <div className="text-xs text-muted-foreground">Project: {e.project}</div>}
                      {e.notes && <div className="text-xs mt-1">{e.notes}</div>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setEditOpen(true); }}><Edit3 size={16} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => duplicateEntry(e.id)}><Copy size={16} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteEntry(e.id)}><Trash2 size={16} /></Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      <AttendanceDialog open={editOpen} onOpenChange={setEditOpen} editing={editing} />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}