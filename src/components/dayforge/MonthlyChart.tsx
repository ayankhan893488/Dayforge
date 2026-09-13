import { useMemo, useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isAfter,
  startOfToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useStore, markFlags } from "@/lib/store";
import { useT } from "@/lib/i18n";

export function MonthlyChart() {
  const marks = useStore((s) => s.marks);
  const togglePresent = useStore((s) => s.togglePresent);
  const toggleNightShift = useStore((s) => s.toggleNightShift);
  const toggleAbsent = useStore((s) => s.toggleAbsent);
  const defaultDailyValue = useStore((s) => s.defaultDailyValue);
  const nightShiftValue = useStore((s) => s.nightShiftValue);
  const t = useT();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }),
    [month],
  );

  const summary = useMemo(() => {
    let present = 0;
    let night = 0;
    let absent = 0;
    let value = 0;
    for (const d of days) {
      const m = marks[format(d, "yyyy-MM-dd")];
      if (!m) continue;
      const f = markFlags(m);
      if (f.absent) absent++;
      if (f.present) present++;
      if (f.night) night++;
      value += m.value;
    }
    const total = days.length;
    const markedDays = days.filter((d) => marks[format(d, "yyyy-MM-dd")]).length;
    const pct = markedDays > 0 ? (present / markedDays) * 100 : 0;
    return { present, night, absent, value, total, remaining: total - markedDays, pct };
  }, [days, marks]);

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-lg hover:bg-accent">
          <ChevronLeft size={18} />
        </button>
        <div className="text-base font-semibold">{format(month, "MMMM yyyy")}</div>
        <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-lg hover:bg-accent">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label={t("att.present")} value={String(summary.present)} />
        <Stat label={t("att.nightShift")} value={String(summary.night)} />
        <Stat label={t("att.absent")} value={String(summary.absent)} />
        <Stat label={t("att.value")} value={summary.value.toFixed(2)} />
        <Stat label={t("att.days")} value={String(summary.total)} />
        <Stat label={t("att.remaining")} value={String(summary.remaining)} />
        <Stat label={t("att.attendance")} value={`${summary.pct.toFixed(2)}%`} />
      </div>

      <div className="text-[11px] text-muted-foreground">
        P {t("att.presentValue")} = <span className="font-semibold text-foreground">{defaultDailyValue}</span> · P+{" "}
        {t("att.nightValue")} = <span className="font-semibold text-foreground">{nightShiftValue}</span> ·{" "}
        {t("att.changeInSettings")}
      </div>
      <div className="text-[11px] text-muted-foreground">{t("att.markHint")}</div>

      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {days.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const m = marks[key];
          const f = markFlags(m);
          const future = isAfter(d, startOfToday());
          return (
            <div
              key={key}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 ${future ? "opacity-60" : ""}`}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold w-6 tabular-nums">{format(d, "d")}</span>
                <span className="text-xs text-muted-foreground">{format(d, "EEE")}</span>
                {m && m.value > 0 && (
                  <span className="text-[10px] text-muted-foreground">+{m.value}</span>
                )}
              </div>
              <div className="flex gap-1.5">
                <MarkButton
                  active={f.present}
                  activeClass="bg-[oklch(0.7_0.2_145)] text-white border-transparent"
                  onClick={() => togglePresent(key)}
                  label="P"
                  title={t("att.present")}
                />
                <MarkButton
                  active={f.night}
                  activeClass="bg-[oklch(0.55_0.2_300)] text-white border-transparent"
                  onClick={() => toggleNightShift(key)}
                  label="P+"
                  title={t("att.nightShift")}
                />
                <MarkButton
                  active={f.absent}
                  activeClass="bg-[oklch(0.65_0.22_25)] text-white border-transparent"
                  onClick={() => toggleAbsent(key)}
                  label="A"
                  title={t("att.absent")}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 py-2">
      <div className="text-sm font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function MarkButton({
  active,
  activeClass,
  onClick,
  label,
  title,
}: {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  label: string;
  title: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-pressed={active}
      aria-label={title}
      title={title}
      className={`h-8 w-8 rounded-lg border text-xs font-bold transition-colors ${
        active ? activeClass : "bg-background text-muted-foreground"
      }`}
    >
      {label}
    </motion.button>
  );
}