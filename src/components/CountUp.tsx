'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * CountUp — animates a number from 0 to `end` the first time it scrolls into
 * view, with an ease-out-quart curve. Honours prefers-reduced-motion (jumps
 * straight to the final value). `performance.now()` is read inside rAF, never
 * during render, so it stays render-pure.
 */
type Props = {
  end: number;
  duration?: number;   // ms
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

export default function CountUp({ end, duration = 1400, prefix = '', suffix = '', decimals = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(end);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return;
        done.current = true;
        io.disconnect();
        let start = 0;
        const step = (ts: number) => {
          if (!start) start = ts;
          const t = Math.min(1, (ts - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4); // ease-out-quart
          setVal(end * eased);
          if (t < 1) raf = requestAnimationFrame(step);
          else setVal(end);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [end, duration]);

  return <span ref={ref} className={className}>{prefix}{val.toFixed(decimals)}{suffix}</span>;
}
