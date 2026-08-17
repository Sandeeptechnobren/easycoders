'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import styles from './attendanceCalendar.module.css';

const BASE = 'https://api.easycoders.in/api';

/* ──────────────────────────────────────────────────────────────────────────
 * Month calendar of one person's attendance.
 *
 * Used in two places with the same code path:
 *   - the student's own page (no userId — the endpoint defaults to the caller)
 *   - the admin / HR / trainer student-detail panel (userId supplied, which
 *     the backend gates behind `view_attendance`)
 *
 * EVERY classification is done server-side, deliberately. Whether a day is
 * present, late or absent depends on the working-week rule, the holiday list
 * and the student's enrolment window — none of which the browser has. Deriving
 * any of it here would mean a second implementation that could disagree with
 * the admin's view of the same student, which is the worst bug an attendance
 * screen can have. This component only paints what it is told.
 *
 * Class names are all `ac*`-prefixed: Bootstrap is loaded globally from a CDN,
 * so a bare `.day` or `.badge` here would collide with its stylesheet.
 * ────────────────────────────────────────────────────────────────────────── */

type DayStatus = 'present' | 'late' | 'absent' | 'holiday' | 'weekend' | 'off';

type Day = {
  date: string;            // YYYY-MM-DD
  status: DayStatus;
  label?: string;          // holiday name
  punch_in?: string | null;
  punch_out?: string | null;
  hours?: number | null;
};

type Summary = {
  working_days: number;
  present: number;
  late: number;
  attended: number;
  absent: number;
  sundays_skipped: number;
  holidays_skipped: number;
  percentage: number | null;
};

type Props = {
  /** Omit to show the signed-in user's own attendance. */
  userId?: number | string;
  /** Bump this to force a refetch — e.g. after an admin marks a day. */
  refreshKey?: number;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
/* Monday-first: Sunday is the non-working day, so putting it last keeps the
   six-day working week visually contiguous instead of split across the ends. */
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_LABEL: Record<DayStatus, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  holiday: 'Holiday',
  weekend: 'Sunday',
  off: 'Not enrolled',
};

/** Local YYYY-MM-DD. NOT toISOString() — that converts to UTC and can land on
 *  the previous day for anyone east of Greenwich, which is everyone here. */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "09:41" from a "YYYY-MM-DD HH:MM:SS" string, without constructing a Date —
 *  a Date would re-interpret the value in the viewer's timezone. */
function clockOf(stamp?: string | null): string {
  if (!stamp) return '—';
  const m = /\d{2}:\d{2}/.exec(stamp.slice(11));
  return m ? m[0] : '—';
}

export default function AttendanceCalendar({ userId, refreshKey = 0 }: Props) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [days, setDays] = useState<Day[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lateBelow, setLateBelow] = useState(3);

  const monthStart = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1), [cursor]);
  const monthEnd = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0), [cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ from: ymd(monthStart), to: ymd(monthEnd) });
      if (userId) params.set('user_id', String(userId));
      const res = await fetchWithAuth(`${BASE}/attendance/calendar?${params.toString()}`);
      if (!res.ok) throw new Error(res.status === 403 ? 'You do not have access to this attendance.' : 'Could not load attendance.');
      const json = await res.json();
      setDays(json?.data?.days ?? []);
      setSummary(json?.data?.summary ?? null);
      if (typeof json?.data?.late_below_hours === 'number') setLateBelow(json.data.late_below_hours);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load attendance.');
      setDays([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [monthStart, monthEnd, userId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  /* Blank cells before the 1st so it lands under the right weekday.
     getDay() is 0=Sun..6=Sat; this grid is Mon-first, so Sunday needs 6 not 0. */
  const leadingBlanks = useMemo(() => (monthStart.getDay() + 6) % 7, [monthStart]);

  const isCurrentMonth =
    cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();
  const todayYmd = ymd(today);

  const shiftMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div className={styles.acWrap}>
      {/* ── Month navigation ─────────────────────────────────────────── */}
      <div className={styles.acHead}>
        <button type="button" className={styles.acNav} onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="m14 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={styles.acMonth} aria-live="polite">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </div>
        <button
          type="button"
          className={styles.acNav}
          onClick={() => shiftMonth(1)}
          /* Nothing to see in the future: the window ends today, so later
             months are entirely "off" cells. */
          disabled={isCurrentMonth}
          aria-label="Next month"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="m10 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Summary ──────────────────────────────────────────────────── */}
      {summary && !loading && (
        <div className={styles.acStats}>
          <div className={styles.acStat}>
            <span className={`${styles.acStatNum} ${styles.acFgPresent}`}>{summary.present}</span>
            <span className={styles.acStatLbl}>Present</span>
          </div>
          <div className={styles.acStat}>
            <span className={`${styles.acStatNum} ${styles.acFgLate}`}>{summary.late}</span>
            <span className={styles.acStatLbl}>Late</span>
          </div>
          <div className={styles.acStat}>
            <span className={`${styles.acStatNum} ${styles.acFgAbsent}`}>{summary.absent}</span>
            <span className={styles.acStatLbl}>Absent</span>
          </div>
          <div className={styles.acStat}>
            <span className={styles.acStatNum}>
              {summary.percentage === null ? '—' : `${summary.percentage}%`}
            </span>
            <span className={styles.acStatLbl}>
              {summary.working_days > 0 ? `of ${summary.working_days} days` : 'no working days'}
            </span>
          </div>
        </div>
      )}

      {error && <p className={styles.acError}>{error}</p>}

      {/* ── Grid ─────────────────────────────────────────────────────── */}
      <div className={styles.acGrid} role="grid" aria-label="Attendance calendar">
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.acWd} role="columnheader">{w}</div>
        ))}

        {loading
          ? Array.from({ length: 35 }, (_, i) => <div key={`s${i}`} className={styles.acSkeleton} />)
          : (
            <>
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <div key={`b${i}`} className={styles.acBlank} aria-hidden="true" />
              ))}
              {days.map((d) => {
                const dayNum = Number(d.date.slice(8));
                const detail =
                  d.status === 'holiday' ? d.label ?? 'Holiday'
                  : d.punch_in
                    ? `${clockOf(d.punch_in)}–${clockOf(d.punch_out)}${
                        typeof d.hours === 'number' ? ` · ${d.hours}h` : ' · no punch-out'
                      }`
                    : STATUS_LABEL[d.status];

                return (
                  <div
                    key={d.date}
                    role="gridcell"
                    className={`${styles.acDay} ${styles[`ac_${d.status}`]} ${
                      d.date === todayYmd ? styles.acToday : ''
                    }`}
                    title={`${d.date} — ${STATUS_LABEL[d.status]}${detail !== STATUS_LABEL[d.status] ? ` (${detail})` : ''}`}
                  >
                    <span className={styles.acNum}>{dayNum}</span>
                    {(d.status === 'present' || d.status === 'late') && (
                      <span className={styles.acTime}>
                        {typeof d.hours === 'number' ? `${d.hours}h` : '—'}
                      </span>
                    )}
                    {d.status === 'holiday' && <span className={styles.acTime}>Hol</span>}
                  </div>
                );
              })}
            </>
          )}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div className={styles.acLegend}>
        {(['present', 'late', 'absent', 'holiday', 'weekend'] as DayStatus[]).map((s) => (
          <span key={s} className={styles.acLegItem}>
            <i className={`${styles.acSwatch} ${styles[`ac_${s}`]}`} aria-hidden="true" />
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span className={styles.acNote}>Under {lateBelow}h on site, or no punch-out, counts as late.</span>
      </div>
    </div>
  );
}
