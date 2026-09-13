import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useStore, type WelcomeAnimation } from "@/lib/store";

export const WELCOME_ANIMATIONS: WelcomeAnimation[] = [
  "fade",
  "slide",
  "zoom",
  "glass",
  "gradient",
  "neon",
  "minimal",
  "premium",
  "particles",
  "splash",
  "none",
];

type Variant = {
  initial: any;
  animate: any;
  transition: any;
  className?: string;
  backdrop?: "aurora" | "gradient" | "particles" | "plain";
};

const VARIANTS: Record<WelcomeAnimation, Variant> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.9 }, backdrop: "aurora" },
  slide: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
    backdrop: "aurora",
  },
  zoom: {
    initial: { opacity: 0, scale: 0.6 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 160, damping: 16 },
    backdrop: "aurora",
  },
  glass: {
    initial: { opacity: 0, scale: 1.08, filter: "blur(18px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
    className:
      "rounded-3xl border border-white/25 bg-white/10 px-8 py-10 backdrop-blur-xl shadow-2xl",
    backdrop: "gradient",
  },
  gradient: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1 },
    backdrop: "gradient",
  },
  neon: {
    initial: { opacity: 0, scale: 0.94, filter: "brightness(2)" },
    animate: { opacity: 1, scale: 1, filter: "brightness(1)" },
    transition: { duration: 0.8 },
    className: "drop-shadow-[0_0_22px_var(--primary)]",
    backdrop: "plain",
  },
  minimal: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
    backdrop: "plain",
  },
  premium: {
    initial: { opacity: 0, y: 60, scale: 0.92, rotateX: 25 },
    animate: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
    backdrop: "gradient",
  },
  particles: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 1 },
    backdrop: "particles",
  },
  splash: {
    initial: { opacity: 0, scale: 1.6, rotate: -6 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { type: "spring", stiffness: 120, damping: 12 },
    backdrop: "particles",
  },
  none: { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 }, backdrop: "plain" },
};

function Backdrop({ kind }: { kind: Variant["backdrop"] }) {
  if (kind === "plain") return null;
  if (kind === "particles") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-primary/70"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.4, 0.8] }}
            transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    );
  }
  if (kind === "gradient") {
    return (
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(120deg, var(--primary), var(--accent), var(--secondary), var(--primary))",
          backgroundSize: "300% 300%",
          opacity: 0.55,
        }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
    );
  }
  return (
    <motion.div
      className="absolute inset-0 opacity-60"
      style={{
        background:
          "radial-gradient(600px circle at 20% 30%, var(--accent), transparent 50%), radial-gradient(600px circle at 80% 70%, var(--primary), transparent 50%)",
      }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
  );
}

export function Welcome({
  onDone,
  animation,
  preview = false,
}: {
  onDone: () => void;
  animation?: WelcomeAnimation;
  preview?: boolean;
}) {
  const userName = useStore((s) => s.userName);
  const greetingText = useStore((s) => s.greetingText);
  const welcomeMessage = useStore((s) => s.welcomeMessage);
  const stored = useStore((s) => s.welcomeAnimation);
  const anim = animation ?? stored;
  const v = VARIANTS[anim] ?? VARIANTS.slide;

  // Ref-held callback: re-renders (store updates) can't restart the timer.
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => done.current(), preview ? 2600 : 1000);
    return () => clearTimeout(t);
  }, [preview]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-background overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Backdrop kind={v.backdrop} />
      <div className="relative text-center px-6" style={{ perspective: 1000 }}>
        <motion.div initial={v.initial} animate={v.animate} transition={v.transition} className={v.className}>
          <div className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
            {greetingText}, {userName}{" "}
            <motion.span
              animate={{ rotate: [0, 20, -10, 20, 0] }}
              transition={{ duration: 1.5, delay: 0.6 }}
              style={{ display: "inline-block" }}
            >
              👋
            </motion.span>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-4 text-base text-muted-foreground"
          >
            {welcomeMessage}
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}