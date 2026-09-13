import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Splash } from "@/components/dayforge/Splash";
import { Welcome } from "@/components/dayforge/Welcome";
const loadDashboard = () => import("@/components/dayforge/Dashboard");
const loadCalendar = () => import("@/components/dayforge/CalendarView");
const loadAttendance = () => import("@/components/dayforge/AttendanceList");
const loadReports = () => import("@/components/dayforge/Reports");
const loadStatistics = () => import("@/components/dayforge/Statistics");
const loadSettings = () => import("@/components/dayforge/Settings");

const Dashboard = lazy(() => loadDashboard().then((m) => ({ default: m.Dashboard })));
const CalendarView = lazy(() => loadCalendar().then((m) => ({ default: m.CalendarView })));
const AttendanceList = lazy(() => loadAttendance().then((m) => ({ default: m.AttendanceList })));
const Reports = lazy(() => loadReports().then((m) => ({ default: m.Reports })));
const Statistics = lazy(() => loadStatistics().then((m) => ({ default: m.Statistics })));
const Settings = lazy(() => loadSettings().then((m) => ({ default: m.Settings })));

/** Warm every tab chunk in the background so switching tabs never waits on a fetch. */
function prefetchTabs() {
  const run = () => {
    void loadCalendar();
    void loadAttendance();
    void loadReports();
    void loadStatistics();
    void loadSettings();
  };
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (ric) ric(run);
  else setTimeout(run, 300);
}
import { BottomNav, type Tab } from "@/components/dayforge/BottomNav";
import { AttendanceDialog } from "@/components/dayforge/AttendanceDialog";
import { useStore } from "@/lib/store";
import { registerServiceWorker, requestPersistentStorage } from "@/lib/pwa";
import { scheduleReminder } from "@/lib/notifications";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DayForge — Premium Attendance Tracker" },
      { name: "description", content: "Track daily work attendance with beautiful reports, streaks, earnings and offline-first sync." },
      { property: "og:title", content: "DayForge — Premium Attendance Tracker" },
      { property: "og:description", content: "Track daily work attendance with beautiful reports, streaks, earnings and offline-first sync." },
    ],
  }),
  component: Index,
});

function Index() {
  const theme = useStore((s) => s.theme);
  const appName = useStore((s) => s.appName);
  const showWelcome = useStore((s) => s.showWelcome);
  const hydrate = useStore((s) => s.hydrate);
  const reminderEnabled = useStore((s) => s.reminderEnabled);
  const reminderTime = useStore((s) => s.reminderTime);
  const [stage, setStage] = useState<"splash" | "welcome" | "app">("splash");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [addOpen, setAddOpen] = useState(false);
  const openAdd = useCallback(() => setAddOpen(true), []);

  useEffect(() => {
    void hydrate().then(() => {
      // Backup pulls in heavy export libs — keep it off the critical open path.
      setTimeout(async () => {
        const { autoBackup } = await import("@/lib/db/backup");
        await autoBackup();
      }, 2500);
    });
    void requestPersistentStorage();
    void registerServiceWorker();
    void loadDashboard();
    prefetchTabs();
  }, [hydrate]);

  useEffect(() => {
    scheduleReminder({ enabled: reminderEnabled, time: reminderTime, appName });
  }, [reminderEnabled, reminderTime, appName]);

  useEffect(() => {
    const root = document.documentElement;
    // Snapshot first: removing while iterating a live DOMTokenList skips classes.
    for (const c of Array.from(root.classList)) {
      if (c.startsWith("theme-")) root.classList.remove(c);
    }
    if (theme !== "coffee") root.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence mode="wait">
        {stage === "splash" && <Splash key="splash" onDone={() => setStage("welcome")} />}
        {stage === "welcome" &&
          (showWelcome ? (
            <Welcome key="welcome" onDone={() => setStage("app")} />
          ) : (
            <SkipWelcome key="skip" onDone={() => setStage("app")} />
          ))}
      </AnimatePresence>

      {stage === "app" && (
        <div className="mx-auto max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              style={{ willChange: "opacity, transform", transform: "translateZ(0)" }}
            >
              <Suspense fallback={<div className="min-h-[60vh]" />}>
                {tab === "dashboard" && <Dashboard onAdd={openAdd} />}
                {tab === "calendar" && <CalendarView />}
                {tab === "attendance" && <AttendanceList />}
                {tab === "reports" && <Reports />}
                {tab === "stats" && <Statistics />}
                {tab === "settings" && <Settings />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
          <BottomNav tab={tab} setTab={setTab} />
          <AttendanceDialog open={addOpen} onOpenChange={setAddOpen} />
        </div>
      )}
    </div>
  );
}

function SkipWelcome({ onDone }: { onDone: () => void }) {
  useEffect(() => { onDone(); }, [onDone]);
  return null;
}
