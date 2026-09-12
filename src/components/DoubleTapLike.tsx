"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

const DOUBLE_TAP_WINDOW_MS = 300;

export default function DoubleTapLike({
  children,
  onLike,
}: {
  children: React.ReactNode;
  onLike: () => void;
}) {
  const [showBurst, setShowBurst] = useState(false);
  const lastTapRef = useRef(0);

  function handleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
      onLike();
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 700);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }

  return (
    <div className="relative" onClick={handleTap}>
      {children}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.15, 1], opacity: [0, 1, 1] }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <Heart size={92} className="fill-white text-white drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
