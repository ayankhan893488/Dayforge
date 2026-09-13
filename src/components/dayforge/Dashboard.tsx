import { motion } from "framer-motion";
import { Plus, TrendingUp, Clock, Calendar as CalIcon, DollarSign } from "lucide-react";
import { useStore } from "@/lib/store";
import { todayTotal, weeklyTotal, monthlyTotal, totalHours, streaks, valueLabel } from "@/lib/dayforge-utils";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";

export function Dashboard({ onAdd }: { onAdd: () => void }) {
  // Field selectors keep this screen from re-rendering on unrelated store writes.
  const entries = useStore((s) => s.entries);
  const userName = useStore((s) => s.userName);
  const appName = useStore((s) => s.appName);
  const currency = useStore((s) => s.currency);
  const ratePerDay = useStore((s) => s.ratePerDay);

  const { today, week, month, hours, current, longest } = useMemo(() => {
    const { current, longest } = streaks(entries);
    return {
      today: todayTotal(entries),
      week: weeklyTotal(entries),
      month: monthlyTotal(entries),
      hours: totalHours(entries),
      current,
      longest,
    };
  }, [entries]);
  const monthly = month * ratePerDay;

  const ringPct = Math.min(1, today / 2);
  const circumference = 2 * Math.PI * 42;

  // last 7 days trend
  const days = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of entries) totals.set(e.date, (totals.get(e.date) ?? 0) + e.value);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { day: format(d, "EEE"), value: totals.get(format(d, "yyyy-MM-dd")) ?? 0 };
    });
  }, [entries]);

  const recent = useMemo(
    () => [...entries].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
    [entries],
  );

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-5 pb-28 space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{appName}</div>
          <h1 className="text-2xl font-bold text-foreground mt-1">{greet}, {userName}</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, dd MMM yyyy")}</p>
        </div>
        <div className="text-right">
          <LiveClock />
        </div>
      </motion.div>

      {/* Progress ring hero card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl p-6 bg-primary text-primary-foreground shadow-xl relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-center gap-5 relative">
          <div className="relative">
            <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeOpacity="0.2" strokeWidth="8" fill="none" />
              <motion.circle
                cx="50" cy="50" r="42"
                stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - ringPct) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-2xl font-bold leading-none">{today}</div>
                <div className="text-[10px] opacity-70 mt-1">TODAY</div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm opacity-80">Today's attendance</div>
            <div className="text-xl font-semibold mt-1">{valueLabel(today)}</div>
            <div className="text-xs opacity-70 mt-1">Streak {current}d · Best {longest}d</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<CalIcon size={16} />} label="This Week" value={week.toString()} suffix="days" delay={0.15} />
        <StatCard icon={<TrendingUp size={16} />} label="This Month" value={month.toString()} suffix="days" delay={0.2} />
        <StatCard icon={<Clock size={16} />} label="Hours" value={hours.toFixed(1)} suffix="hrs" delay={0.25} />
        <StatCard icon={<DollarSign size={16} />} label="Earnings" value={`${currency}${monthly.toLocaleString()}`} suffix="" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl bg-card border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-foreground">Last 7 days</div>
          <div className="text-xs text-muted-foreground">Trend</div>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={days}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-foreground">Recent activity</div>
        </div>
        <div className="space-y-2">
          {recent.length === 0 && (
            <div className="text-sm text-muted-foreground bg-card border rounded-2xl p-4 text-center">
              No entries yet. Tap + to add your first day.
            </div>
          )}
          {recent.map((e) => (
            <div key={e.id} className="rounded-2xl bg-card border p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">{format(parseISO(e.date), "EEE, dd MMM")}</div>
                <div className="text-xs text-muted-foreground">{e.project || e.category || e.notes || "Attendance logged"}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">{e.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{valueLabel(e.value)}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.button
        onClick={onAdd}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className="fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl grid place-items-center"
      >
        <Plus size={24} />
      </motion.button>
    </div>
  );
}

function StatCard({ icon, label, value, suffix, delay }: { icon: React.ReactNode; label: string; value: string; suffix: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-card border p-4"
    >
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </motion.div>
  );
}

/** Isolated so the per-second tick never re-renders the charts or stat cards. */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    // Align to the next second boundary so the clock never drifts or double-ticks.
    const tick = () => {
      const d = new Date();
      setNow(d);
      timer = setTimeout(tick, 1000 - (d.getTime() % 1000));
    };
    const onVisibility = () => {
      stop();
      // Pause while backgrounded (saves battery), resync instantly on return.
      if (!document.hidden) tick();
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return (
    <div className="text-2xl font-mono font-semibold text-foreground tabular-nums">
      {format(now, "h:mm:ss a")}
    </div>
  );
}
