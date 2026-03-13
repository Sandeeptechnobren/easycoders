'use client';

import type { FormEvent } from 'react';
import styles from './SearchBox.module.css';

export type SearchBoxProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
};

export default function SearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search…',
  icon = '🔍',
  className,
  inputClassName,
  ariaLabel = 'Search',
}: SearchBoxProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form className={`${styles.searchBox} ${className ?? ''}`} onSubmit={handleSubmit}>
      
      <input
        type="search"
        placeholder={placeholder}
        className={`${styles.searchInput} ${inputClassName ?? ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
    </form>
  );
}


