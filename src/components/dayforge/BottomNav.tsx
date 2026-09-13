import { Home, Calendar, ListChecks, BarChart3, PieChart, Settings as SettingsIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";

export type Tab = "dashboard" | "calendar" | "attendance" | "reports" | "stats" | "settings";

const items: { key: Tab; labelKey: "nav.home" | "nav.calendar" | "nav.log" | "nav.reports" | "nav.stats" | "nav.settings"; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "dashboard", labelKey: "nav.home", icon: Home },
  { key: "calendar", labelKey: "nav.calendar", icon: Calendar },
  { key: "attendance", labelKey: "nav.log", icon: ListChecks },
  { key: "reports", labelKey: "nav.reports", icon: BarChart3 },
  { key: "stats", labelKey: "nav.stats", icon: PieChart },
  { key: "settings", labelKey: "nav.settings", icon: SettingsIcon },
];

export function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const t = useT();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-card/95 backdrop-blur-md">
      <div className="mx-auto max-w-md flex items-center justify-between px-2 py-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1.5 flex-1"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-x-1 inset-y-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={18} />
              <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{t(it.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}