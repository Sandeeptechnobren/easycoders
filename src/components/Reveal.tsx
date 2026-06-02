'use client';

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

/**
 * Reveal — fades + slides its children up the first time they scroll into view.
 *
 * Brand-register motion (one rehearsed entrance, not scattered micro-anims):
 * transform/opacity only, ease-out-expo, and it honours prefers-reduced-motion
 * by showing content immediately. `delay` staggers siblings.
 */
type Props = {
  children: ReactNode;
  delay?: number;        // ms
  y?: number;            // px slide distance
  threshold?: number;
  className?: string;
  style?: CSSProperties;
};

export default function Reveal({ children, delay = 0, y = 16, threshold = 0.15, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setShown(true); io.disconnect(); }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translateY(${y}px)`,
        transition: `opacity .6s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .6s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
