import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { buzz } from "@/lib/haptics";

/** عارض صور بملء الشاشة مع تنقّل بين اللقطات */
export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
  alt = "",
}: {
  images: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  alt?: string;
}) {
  const open = index !== null;

  const step = useCallback(
    (dir: 1 | -1) => {
      if (index === null || images.length === 0) return;
      buzz(15);
      onIndexChange((index + dir + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(-1);
      if (e.key === "ArrowLeft") step(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, step]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] grid place-items-center bg-background/95 backdrop-blur-xl p-4"
        >
          <motion.img
            key={index}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            src={images[index!]}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-2xl border border-primary/25 object-contain shadow-[0_0_60px_-20px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
          />

          <button
            type="button"
            aria-label="إغلاق"
            onClick={onClose}
            className="absolute left-4 top-4 grid size-11 place-items-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur"
          >
            <X className="size-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="السابق"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/80 backdrop-blur"
              >
                <ChevronRight className="size-5" />
              </button>
              <button
                type="button"
                aria-label="التالي"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/80 backdrop-blur"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="absolute bottom-6 rounded-full border border-border bg-card/80 px-3 py-1 text-xs backdrop-blur">
                {(index ?? 0) + 1} / {images.length}
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
