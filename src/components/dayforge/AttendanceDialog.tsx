import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore, type AttendanceEntry } from "@/lib/store";
import { todayStr } from "@/lib/dayforge-utils";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { motion } from "framer-motion";

const PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const DRAFT_KEY = "attendance-dialog";

type Draft = {
  date: string;
  start: string;
  end: string;
  value: number;
  custom: string;
  notes: string;
  project: string;
  site: string;
  category: string;
};

export function AttendanceDialog({
  open,
  onOpenChange,
  editing,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: AttendanceEntry | null;
  defaultDate?: string;
}) {
  const addEntry = useStore((s) => s.addEntry);
  const updateEntry = useStore((s) => s.updateEntry);

  const [date, setDate] = useState(defaultDate || todayStr());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [value, setValue] = useState<number>(1);
  const [custom, setCustom] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [project, setProject] = useState("");
  const [site, setSite] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (editing) {
      setDate(editing.date);
      setStart(editing.startTime || "");
      setEnd(editing.endTime || "");
      setValue(editing.value);
      setNotes(editing.notes || "");
      setProject(editing.project || "");
      setSite(editing.site || "");
      setCategory(editing.category || "");
    } else if (open) {
      // Recover an entry that was interrupted by a crash / app close.
      const d = loadDraft<Draft>(DRAFT_KEY);
      setDate(d?.date || defaultDate || todayStr());
      setStart(d?.start ?? "");
      setEnd(d?.end ?? "");
      setValue(d?.value ?? 1);
      setCustom(d?.custom ?? "");
      setNotes(d?.notes ?? "");
      setProject(d?.project ?? "");
      setSite(d?.site ?? "");
      setCategory(d?.category ?? "");
    }
  }, [editing, open, defaultDate]);

  // Persist the in-progress form continuously — no manual save, nothing lost.
  useEffect(() => {
    if (!open || editing) return;
    saveDraft(DRAFT_KEY, { date, start, end, value, custom, notes, project, site, category });
  }, [open, editing, date, start, end, value, custom, notes, project, site, category]);

  const hours =
    start && end
      ? Math.max(
          0,
          (new Date(`2000-01-01T${end}`).getTime() - new Date(`2000-01-01T${start}`).getTime()) /
            3600000,
        )
      : undefined;

  const submit = () => {
    const finalVal = custom ? Number(custom) : value;
    if (!finalVal || isNaN(finalVal)) return;
    const data = {
      date,
      startTime: start || undefined,
      endTime: end || undefined,
      hours,
      value: finalVal,
      notes: notes || undefined,
      project: project || undefined,
      site: site || undefined,
      category: category || undefined,
    };
    if (editing) updateEntry(editing.id, data);
    else addEntry(data);
    clearDraft(DRAFT_KEY);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Attendance" : "Add Attendance"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Start</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div>
              <Label>Hours</Label>
              <Input readOnly value={hours ? hours.toFixed(2) : ""} placeholder="auto" />
            </div>
          </div>

          <div>
            <Label>Attendance Value</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {PRESETS.map((p) => (
                <motion.button
                  key={p}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setValue(p);
                    setCustom("");
                  }}
                  className={`rounded-lg py-2 text-sm font-medium border transition-colors ${
                    !custom && value === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                  }`}
                >
                  {p}
                </motion.button>
              ))}
            </div>
            <Input
              className="mt-2"
              type="number"
              step="0.25"
              placeholder="Custom value"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Project</Label>
              <Input value={project} onChange={(e) => setProject(e.target.value)} />
            </div>
            <div>
              <Label>Site</Label>
              <Input value={site} onChange={(e) => setSite(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Overtime, Holiday Work..." />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{editing ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}