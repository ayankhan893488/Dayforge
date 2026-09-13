import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const COLORS = ["oklch(0.7 0.2 145)", "oklch(0.6 0.18 240)", "oklch(0.55 0.2 300)", "oklch(0.8 0.18 85)", "oklch(0.65 0.22 25)"];

export function Reports() {
  const entries = useStore((s) => s.entries);

  const monthlyData = useMemo(() => {
    const start = startOfMonth(subMonths(new Date(), 5));
    const months = eachMonthOfInterval({ start, end: new Date() });
    return months.map((m) => {
      const s = startOfMonth(m).getTime();
      const e = endOfMonth(m).getTime();
      const total = entries.filter((x) => {
        const t = parseISO(x.date).getTime();
        return t >= s && t <= e;
      }).reduce((a, b) => a + b.value, 0);
      return { month: format(m, "MMM"), total: +total.toFixed(2) };
    });
  }, [entries]);

  const distribution = useMemo(() => {
    const buckets: Record<string, number> = { "Full": 0, "1.5+": 0, "2+": 0, "Half": 0, "Other": 0 };
    entries.forEach((e) => {
      if (e.value >= 2) buckets["2+"]++;
      else if (e.value >= 1.5) buckets["1.5+"]++;
      else if (e.value >= 1) buckets["Full"]++;
      else if (e.value >= 0.5) buckets["Half"]++;
      else buckets["Other"]++;
    });
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const trend = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const s = format(d, "yyyy-MM-dd");
      return { day: format(d, "dd"), value: entries.filter((e) => e.date === s).reduce((a, b) => a + b.value, 0) };
    });
    return days;
  }, [entries]);

  const exportCSV = () => {
    const rows = [
      ["Date", "Value", "Hours", "Project", "Site", "Category", "Notes"],
      ...entries.map((e) => [e.date, e.value, e.hours || "", e.project || "", e.site || "", e.category || "", (e.notes || "").replace(/\n/g, " ")]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dayforge-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-5 pb-28 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download size={14} className="mr-1" /> CSV</Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border p-4">
        <div className="text-sm font-semibold mb-3">Monthly Attendance</div>
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-card border p-4">
        <div className="text-sm font-semibold mb-3">Distribution</div>
        <div className="h-52">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-card border p-4">
        <div className="text-sm font-semibold mb-3">30-day Trend</div>
        <div className="h-40">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={22} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}