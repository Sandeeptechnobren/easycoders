'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Dropdown.module.css';

type Option = {
  label: string;
  value: string | number;
};

type Props = {
  options: Option[];
  value?: string | number;
  placeholder?: string;
  onChange: (value: string | number) => void;
};

export default function Dropdown({
  options,
  value,
  placeholder = 'Select an option',
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.wrapper} ref={ref}>
      <div
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className={!selectedOption ? styles.placeholder : ''}>
          {selectedOption?.label || placeholder}
        </span>
        <span>▾</span>
      </div>

      {open && (
        <div className={styles.menu}>
          {options.map(opt => (
            <div
              key={opt.value}
              className={`${styles.item} ${
                value === opt.value ? styles.selected : ''
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
