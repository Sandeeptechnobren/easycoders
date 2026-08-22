'use client';

import { useRef, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { AdminSection } from '@/components/admin/AdminSection';
import { fetchWithAuth } from '@/lib/api';
import styles from './bulkUpload.module.css';

const BASE = 'https://api.easycoders.in/api';
const LOGIN_URL = 'https://www.easycoders.in/self-assessment/login';

/* ──────────────────────────────────────────────────────────────────────────
 * Easy Assess — bulk user upload.
 *
 * Takes the registration sheet, creates an account per row with a generated
 * password, and emails each person their own credentials plus the login link.
 *
 * The result panel is the point of this screen, not the upload button. A bulk
 * import that silently half-works is worse than one that fails outright, so
 * every row is accounted for: created, skipped (and why), or failed (and why).
 * ────────────────────────────────────────────────────────────────────────── */

type Created = { row: string; email: string; name: string; emailed: boolean; mail_error?: string | null };
type Skipped = { row: string; email: string; reason: string };
type Failed = { row: string; email?: string; reason: string };

type Result = {
  created_count: number;
  skipped_count: number;
  failed_count: number;
  emailed_count: number;
  login_url: string;
  created: Created[];
  skipped: Skipped[];
  failed: Failed[];
};

const REASON_LABEL: Record<string, string> = {
  already_exists: 'Already registered — password left untouched',
  duplicate_in_file: 'Appears more than once in this file',
};

const HEADERS = ['Email Address', 'Full Name', 'Phone Number', 'Address', 'Course Name', 'College Name', 'Expected Graduation Year'];

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('ass_file', file);
      // No Content-Type header on purpose: the browser must set the multipart
      // boundary itself, and setting it by hand breaks the upload.
      const json = await fetchWithAuth(`${BASE}/assessment/get_assessment_user`, {
        method: 'POST',
        body: form,
      });
      setResult(json?.data ?? null);
      if (!json?.data) setError(json?.message || 'The server returned no result.');
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'Unauthorized'
          ? 'Your session expired, or you lack permission to import users.'
          : e instanceof Error ? e.message : 'Upload failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Admin"
        title="Bulk User Upload"
        description="Upload the registration sheet to create Easy Assess accounts in bulk. Each new user is emailed a generated password and the login link."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Bulk Upload' },
        ]}
      >
        <div className={styles.wrap}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>1 · Choose the sheet</h3>
            <p className={styles.hint}>
              Accepts <code>.xlsx</code>, <code>.xls</code> or <code>.csv</code>, up to 10&nbsp;MB.
              Columns are matched by <strong>header name</strong>, so their order does not matter
              and extra columns are ignored.
            </p>

            <div className={styles.expected}>
              <span className={styles.expectedLabel}>Recognised headers</span>
              <div className={styles.chips}>
                {HEADERS.map((h) => <span key={h} className={styles.chip}>{h}</span>)}
              </div>
              <p className={styles.hintSmall}>
                Only <strong>Email Address</strong> is required. Where the sheet has two email
                columns, the first valid address becomes the login and the second is kept as the
                parent/guardian contact.
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              className={styles.file}
              accept=".xlsx,.xls,.csv"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(''); }}
            />

            {file && <p className={styles.fileName}>{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}

            <div className={styles.actions}>
              <button type="button" className={styles.primary} disabled={!file || busy} onClick={upload}>
                {busy ? 'Importing…' : 'Import and send credentials'}
              </button>
              {(file || result) && (
                <button type="button" className={styles.ghost} onClick={reset} disabled={busy}>Clear</button>
              )}
            </div>

            <p className={styles.warn}>
              Every newly created user is emailed immediately. Existing accounts are skipped and
              their passwords are never changed, so re-uploading the same sheet is safe.
            </p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {result && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>2 · Result</h3>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={`${styles.statNum} ${styles.ok}`}>{result.created_count}</span>
                  <span className={styles.statLbl}>Created</span>
                </div>
                <div className={styles.stat}>
                  <span className={`${styles.statNum} ${styles.ok}`}>{result.emailed_count}</span>
                  <span className={styles.statLbl}>Emailed</span>
                </div>
                <div className={styles.stat}>
                  <span className={`${styles.statNum} ${styles.warnNum}`}>{result.skipped_count}</span>
                  <span className={styles.statLbl}>Skipped</span>
                </div>
                <div className={styles.stat}>
                  <span className={`${styles.statNum} ${styles.bad}`}>{result.failed_count}</span>
                  <span className={styles.statLbl}>Failed</span>
                </div>
              </div>

              {result.created_count > result.emailed_count && (
                <div className={styles.error}>
                  {result.created_count - result.emailed_count} account(s) were created but the
                  credential email failed. Those users cannot log in until someone sends them a
                  password — see the table below.
                </div>
              )}

              {result.created.length > 0 && (
                <>
                  <h4 className={styles.subTitle}>Created</h4>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Row</th><th>Name</th><th>Email</th><th>Credentials</th></tr></thead>
                      <tbody>
                        {result.created.map((c) => (
                          <tr key={c.email}>
                            <td>{c.row}</td>
                            <td>{c.name}</td>
                            <td>{c.email}</td>
                            <td>
                              {c.emailed
                                ? <span className={styles.pillOk}>Sent</span>
                                : <span className={styles.pillBad} title={c.mail_error ?? ''}>Failed</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {result.skipped.length > 0 && (
                <>
                  <h4 className={styles.subTitle}>Skipped</h4>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Row</th><th>Email</th><th>Reason</th></tr></thead>
                      <tbody>
                        {result.skipped.map((s, i) => (
                          <tr key={`${s.email}-${i}`}>
                            <td>{s.row}</td><td>{s.email}</td>
                            <td>{REASON_LABEL[s.reason] ?? s.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {result.failed.length > 0 && (
                <>
                  <h4 className={styles.subTitle}>Failed</h4>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Row</th><th>Email</th><th>Reason</th></tr></thead>
                      <tbody>
                        {result.failed.map((f, i) => (
                          <tr key={i}>
                            <td>{f.row}</td><td>{f.email ?? '—'}</td>
                            <td className={styles.reason}>{f.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <p className={styles.hintSmall}>
                Users sign in at{' '}
                <a href={result.login_url || LOGIN_URL} target="_blank" rel="noreferrer">
                  {result.login_url || LOGIN_URL}
                </a>
              </p>
            </div>
          )}
        </div>
      </AdminSection>
    </RoleGuard>
  );
}
