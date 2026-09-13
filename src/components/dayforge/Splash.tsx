import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

export function Splash({ onDone }: { onDone: () => void }) {
  const appName = useStore((s) => s.appName);
  // Keep the callback in a ref so re-renders never restart the timer.
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => done.current(), 850);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 60%)" }}
        animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, 20, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 60%)" }}
        animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0], y: [0, -20, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      />
      <div className="flex flex-col items-center gap-4 relative">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="grid place-items-center h-24 w-24 rounded-3xl bg-primary text-primary-foreground shadow-xl"
        >
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 15l2.5 2.5L16 12" />
          </svg>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-bold tracking-tight text-foreground"
        >
          {appName}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground"
        >
          Track your day, effortlessly
        </motion.p>
      </div>
    </motion.div>
  );
}