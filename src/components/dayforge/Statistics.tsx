import { useStore } from "@/lib/store";
import { totalHours, streaks } from "@/lib/dayforge-utils";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";

export function Statistics() {
  const entries = useStore((s) => s.entries);
  const { totalDays, totalUnits, hours, avgHours, avgUnits, current, longest } = useMemo(() => {
    const totalDays = entries.length;
    const totalUnits = entries.reduce((a, b) => a + b.value, 0);
    const hours = totalHours(entries);
    const { current, longest } = streaks(entries);
    return {
      totalDays,
      totalUnits,
      hours,
      avgHours: totalDays ? hours / totalDays : 0,
      avgUnits: totalDays ? totalUnits / totalDays : 0,
      current,
      longest,
    };
  }, [entries]);

  const { bestMonth, bestDay, worstDay } = useMemo(() => {
    const monthMap: Record<string, number> = {};
    entries.forEach((e) => {
      const k = e.date.slice(0, 7);
      monthMap[k] = (monthMap[k] || 0) + e.value;
    });
    const bestMonth = Object.entries(monthMap).sort((a, b) => b[1] - a[1])[0];

    const sorted = [...entries].sort((a, b) => b.value - a.value);
    return {
      bestMonth: bestMonth ? `${format(parseISO(bestMonth[0] + "-01"), "MMM yyyy")} · ${bestMonth[1].toFixed(2)}` : "—",
      bestDay: sorted[0] ? `${format(parseISO(sorted[0].date), "dd MMM")} · ${sorted[0].value}` : "—",
      worstDay: sorted[sorted.length - 1] ? `${format(parseISO(sorted[sorted.length - 1].date), "dd MMM")} · ${sorted[sorted.length - 1].value}` : "—",
    };
  }, [entries]);

  const stats = [
    { label: "Total Days Worked", value: totalDays },
    { label: "Attendance Units", value: totalUnits.toFixed(2) },
    { label: "Working Hours", value: hours.toFixed(1) },
    { label: "Avg Hours / Day", value: avgHours.toFixed(2) },
    { label: "Avg Attendance", value: avgUnits.toFixed(2) },
    { label: "Current Streak", value: `${current}d` },
    { label: "Longest Streak", value: `${longest}d` },
    { label: "Most Productive Month", value: bestMonth },
    { label: "Highest Day", value: bestDay },
    { label: "Lowest Day", value: worstDay },
  ];

  const insight = totalDays === 0
    ? "Log your first day to unlock personalized insights."
    : current > 0
    ? `You're on a ${current}-day streak. Keep the momentum going!`
    : `Your average day is ${avgUnits.toFixed(2)} units. Aim for consistency this week.`;

  return (
    <div className="p-5 pb-28 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Statistics</h1>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-primary text-primary-foreground p-5">
        <div className="text-[10px] uppercase tracking-widest opacity-70">AI Insight</div>
        <div className="mt-1 text-base font-medium">{insight}</div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl bg-card border p-4"
          >
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-lg font-semibold text-foreground mt-1 truncate">{s.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}