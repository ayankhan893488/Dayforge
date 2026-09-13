import { useState, useMemo, useDeferredValue } from "react";
import { useStore, type AttendanceEntry } from "@/lib/store";
import { format, parseISO } from "date-fns";
import { Edit3, Trash2, Copy, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { valueLabel } from "@/lib/dayforge-utils";
import { AttendanceDialog } from "./AttendanceDialog";

export function AttendanceList() {
  const entries = useStore((s) => s.entries);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const duplicateEntry = useStore((s) => s.duplicateEntry);
  const [q, setQ] = useState("");
  // Keeps typing responsive while a large list filters.
  const deferredQ = useDeferredValue(q);
  const [filterVal, setFilterVal] = useState<string>("all");
  const [editing, setEditing] = useState<AttendanceEntry | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = deferredQ.trim().toLowerCase();
    return entries
      .filter((e) => {
        if (filterVal !== "all" && String(e.value) !== filterVal) return false;
        if (!needle) return true;
        return [e.notes, e.project, e.site, e.category, e.date]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [entries, deferredQ, filterVal]);

  return (
    <div className="p-5 pb-28 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus size={16} className="mr-1" /> Add
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-9" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {["all", "0.5", "1", "1.5", "2"].map((v) => (
          <button
            key={v}
            onClick={() => setFilterVal(v)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              filterVal === v ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border"
            }`}
          >
            {v === "all" ? "All" : `${v} day`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((e) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl bg-card border p-3 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-foreground">{format(parseISO(e.date), "EEE, dd MMM yyyy")}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {valueLabel(e.value)} · {e.value} {e.hours ? `· ${e.hours.toFixed(1)}h` : ""}
                </div>
                {(e.project || e.notes) && (
                  <div className="text-xs text-muted-foreground mt-1 truncate max-w-[220px]">{e.project} {e.notes ? `— ${e.notes}` : ""}</div>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setOpen(true); }}><Edit3 size={16} /></Button>
                <Button size="icon" variant="ghost" onClick={() => duplicateEntry(e.id)}><Copy size={16} /></Button>
                <Button size="icon" variant="ghost" onClick={() => deleteEntry(e.id)}><Trash2 size={16} /></Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">No entries found.</div>
        )}
      </div>

      <AttendanceDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}