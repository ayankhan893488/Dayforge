import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore, type ThemeKey, type WelcomeAnimation } from "@/lib/store";
import { useT, LANGUAGES } from "@/lib/i18n";
import { getDb } from "@/lib/db";
import { formatDateTime12 } from "@/lib/dayforge-utils";
import {
  autoBackup,
  exportCsv,
  exportExcel,
  exportJson,
  exportPdf,
  getAutoBackup,
  getAutoBackupTime,
  parseBackup,
} from "@/lib/db/backup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Welcome, WELCOME_ANIMATIONS } from "./Welcome";
import { requestPersistentStorage } from "@/lib/pwa";
import { notificationPermission, requestNotificationPermission } from "@/lib/notifications";

const THEMES: { key: ThemeKey; name: string; swatch: string[] }[] = [
  { key: "coffee", name: "Coffee & White", swatch: ["#c9a37c", "#f7f1e6", "#5a3d2b"] },
  { key: "hacker", name: "Hacker", swatch: ["#00ff88", "#0a0a0a", "#004d29"] },
  { key: "midnight", name: "Midnight Blue", swatch: ["#1e3a8a", "#3b82f6", "#0f172a"] },
  { key: "emerald", name: "Emerald Pro", swatch: ["#059669", "#ecfdf5", "#064e3b"] },
  { key: "royal", name: "Royal Purple", swatch: ["#7c3aed", "#ede9fe", "#3b0764"] },
  { key: "sunset", name: "Sunset Orange", swatch: ["#f97316", "#fef3c7", "#7c2d12"] },
  { key: "arctic", name: "Arctic White", swatch: ["#ffffff", "#f8fafc", "#0f172a"] },
];

export function Settings() {
  const s = useStore();
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [engine, setEngine] = useState("…");
  const [autoAt, setAutoAt] = useState<number | null>(null);
  const [previewAnim, setPreviewAnim] = useState<WelcomeAnimation | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const markCount = Object.keys(s.marks).length;

  useEffect(() => {
    void getDb().then((db) => setEngine(db.engine));
    void getAutoBackupTime().then(setAutoAt);
    void navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, [markCount, s.entries.length]);

  const run = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const importBackup = async (file: File) => {
    const backup = parseBackup(await file.text());
    await s.restore(backup, "merge");
    toast.success(`Restored ${backup.marks.length} attendance records`);
  };

  const restoreAuto = async () => {
    const backup = await getAutoBackup();
    if (!backup) throw new Error("No automatic backup yet");
    await s.restore(backup, "merge");
  };

  const toggleReminder = async (on: boolean) => {
    if (!on) {
      s.setReminderEnabled(false);
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      toast.error("Notifications aren't available or were blocked by your browser");
      return;
    }
    s.setReminderEnabled(true);
    toast.success(`Daily reminder set for ${s.reminderTime}`);
  };

  return (
    <div className="p-5 pb-28 space-y-5">
      <h1 className="text-2xl font-bold text-foreground">{t("s.settings")}</h1>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">{t("s.personal")}</div>
        <div>
          <Label>{t("s.yourName")}</Label>
          <Input value={s.userName} onChange={(e) => s.setUserName(e.target.value)} />
        </div>
        <div>
          <Label>{t("s.appName")}</Label>
          <Input value={s.appName} onChange={(e) => s.setAppName(e.target.value)} placeholder="DayForge" />
          <p className="text-xs text-muted-foreground mt-1">{t("s.appNameHint")}</p>
        </div>
      </section>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">{t("s.language")}</div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <motion.button
              key={l.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => s.setLanguage(l.key)}
              className={`rounded-xl border py-2 text-sm font-medium transition-all ${
                s.language === l.key ? "ring-2 ring-primary border-primary text-primary" : "text-muted-foreground"
              }`}
            >
              {l.native}
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("s.languageHint")}</p>
      </section>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">{t("s.welcome")}</div>
        <label className="flex items-center justify-between text-sm">
          <span>{t("s.showWelcome")}</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--primary)]"
            checked={s.showWelcome}
            onChange={(e) => s.setShowWelcome(e.target.checked)}
          />
        </label>
        <div>
          <Label>{t("s.welcomeName")}</Label>
          <Input value={s.userName} onChange={(e) => s.setUserName(e.target.value)} />
        </div>
        <div>
          <Label>{t("s.greetingText")}</Label>
          <Input value={s.greetingText} onChange={(e) => s.setGreetingText(e.target.value)} placeholder="Hello" />
        </div>
        <div>
          <Label>{t("s.welcomeMessage")}</Label>
          <Input value={s.welcomeMessage} onChange={(e) => s.setWelcomeMessage(e.target.value)} />
        </div>
        <div>
          <Label>{t("s.welcomeAnimation")}</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {WELCOME_ANIMATIONS.map((a) => (
              <motion.button
                key={a}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  s.setWelcomeAnimation(a);
                  setPreviewAnim(a);
                }}
                className={`rounded-xl border py-2 text-[11px] font-semibold transition-all ${
                  s.welcomeAnimation === a ? "ring-2 ring-primary border-primary text-primary" : "text-muted-foreground"
                }`}
              >
                {t(`anim.${a}` as "anim.fade")}
              </motion.button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Tap any style to preview it and save it as your default.
          </p>
        </div>
      </section>

      <AnimatePresence>
        {previewAnim && (
          <Welcome key={previewAnim} animation={previewAnim} preview onDone={() => setPreviewAnim(null)} />
        )}
      </AnimatePresence>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">{t("s.themes")}</div>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <motion.button
              key={t.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => s.setTheme(t.key)}
              className={`rounded-xl border p-3 text-left transition-all ${
                s.theme === t.key ? "ring-2 ring-primary border-primary" : ""
              }`}
            >
              <div className="flex gap-1 mb-2">
                {t.swatch.map((c, i) => (
                  <span key={i} className="h-6 w-6 rounded-md border" style={{ background: c }} />
                ))}
              </div>
              <div className="text-xs font-medium">{t.name}</div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">{t("s.earnings")}</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>{t("s.currency")}</Label>
            <Input value={s.currency} onChange={(e) => s.setCurrency(e.target.value)} />
          </div>
          <div>
            <Label>{t("s.ratePerDay")}</Label>
            <Input type="number" value={s.ratePerDay} onChange={(e) => s.setRatePerDay(Number(e.target.value) || 0)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">{t("s.defaultDaily")}</div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 1.25, 1.5, 1.75, 2].map((v) => (
            <motion.button
              key={v}
              whileTap={{ scale: 0.94 }}
              onClick={() => s.setDefaultDailyValue(v)}
              className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                s.defaultDailyValue === v ? "ring-2 ring-primary border-primary text-primary" : "text-muted-foreground"
              }`}
            >
              {v}
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("s.defaultDailyHint")}</p>
      </section>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">🌙 {t("s.nightValue")}</div>
        <div className="grid grid-cols-5 gap-2">
          {[1.5, 1.75, 2, 2.5, 3].map((v) => (
            <motion.button
              key={v}
              whileTap={{ scale: 0.94 }}
              onClick={() => s.setNightShiftValue(v)}
              className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                s.nightShiftValue === v ? "ring-2 ring-primary border-primary text-primary" : "text-muted-foreground"
              }`}
            >
              {v}
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("s.nightValueHint")}</p>
      </section>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">{t("s.database")}</div>
        <div className="text-xs text-muted-foreground">
          {t("s.engine")}: <span className="font-semibold text-foreground uppercase">{engine}</span> ·{" "}
          {markCount} {t("s.records")} · {s.entries.length} {t("s.logEntries")} · {t("s.offline")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("s.lastAutoBackup")}:{" "}
          <span className="font-medium text-foreground">
            {autoAt ? formatDateTime12(autoAt) : t("s.notYet")}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Persistent storage:{" "}
          <span className="font-medium text-foreground">
            {persisted === null ? "unknown" : persisted ? "granted" : "not granted"}
          </span>
          {persisted === false && (
            <button
              className="ml-2 underline text-primary"
              onClick={() =>
                void requestPersistentStorage().then((ok) => {
                  setPersisted(ok);
                  ok ? toast.success("Storage is now protected") : toast.error("Browser declined");
                })
              }
            >
              Enable
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">Daily reminder</div>
        <label className="flex items-center justify-between text-sm">
          <span>Remind me to mark attendance</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--primary)]"
            checked={s.reminderEnabled}
            onChange={(e) => void toggleReminder(e.target.checked)}
          />
        </label>
        <div>
          <Label>Reminder time</Label>
          <Input type="time" value={s.reminderTime} onChange={(e) => s.setReminderTime(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">
          {notificationPermission() === "unsupported"
            ? "Your browser doesn't support notifications — everything else keeps working."
            : "Reminders fire while DayForge is installed or open in the background."}
        </p>
      </section>

      <section className="rounded-2xl bg-card border p-4 space-y-3">
        <div className="text-sm font-semibold">{t("s.backup")}</div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => run(exportJson, "Backup exported")}>Export JSON</Button>
          <Button variant="outline" onClick={() => run(exportCsv, "CSV exported")}>Export CSV</Button>
          <Button variant="outline" onClick={() => run(exportExcel, "Excel exported")}>Export Excel</Button>
          <Button variant="outline" onClick={() => run(() => exportPdf(s.appName), "PDF exported")}>Export PDF</Button>
          <Button variant="outline" onClick={() => run(() => autoBackup(true), "Backup saved")}>Manual Backup</Button>
          <Button variant="outline" onClick={() => run(restoreAuto, "Backup restored")}>Restore Backup</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>Import Backup</Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void run(() => importBackup(f), "Backup imported");
          }}
        />
        <p className="text-xs text-muted-foreground">
          Imports merge by date and keep the newest record, so Night Shift days are never
          duplicated or overwritten by older data.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              Delete All Attendance Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Attendance Data</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes {markCount} attendance records and {s.entries.length} log
                entries from this device. Export a backup first — this cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  s.resetAll();
                  toast.success("All attendance data deleted");
                }}
              >
                Delete everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <div className="text-center text-xs text-muted-foreground pt-2">
        {s.appName} · v1.0.0
      </div>
    </div>
  );
}