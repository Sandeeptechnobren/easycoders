'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Loader from '@/components/Loader';

/* Module-scope so the purity rule doesn't flag Date.now() being called inside
   the component render (same pattern as MyTasksCard). */
const fmtDue = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null);
const isOverdue = (d?: string | null) => !!d && new Date(d).getTime() < Date.now() - 86400000;

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskCategories, setTaskCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [preview, setPreview] = useState<any | null>(null);

  useEffect(() => {
    api.get('/student/tasks', { params: { category_id: selectedCategory } })
      .then(res => setTasks(res.data?.data ?? res.data))
      .finally(() => setLoadingTasks(false));
  }, [selectedCategory]);

  useEffect(() => {
    api.get('/getTaskCategories')
      .then(res => setTaskCategories(res.data?.data ?? res.data))
      .finally(() => setLoadingCategories(false));
  }, []);

  // Deep-link from a task notification: ?category=<id> preselects that category.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cat = new URLSearchParams(window.location.search).get('category');
    if (cat) setSelectedCategory(cat);
  }, []);

  // Close the question/output popup on Escape.
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreview(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [preview]);

  if (loadingTasks || loadingCategories) return <Loader fullscreen />;

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // The student's status comes from their submission (my_submission), not the task row.
  const taskStatus = (t: { my_submission?: { status?: string } | null }): string => {
    const s = t?.my_submission?.status;
    if (s === 'completed' || s === 'approved') return 'completed';
    if (s === 'rejected') return 'rejected';
    if (s === 'pending')  return 'submitted';
    return 'pending';
  };
  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    completed: { bg: '#f0fdf4', color: '#15803d', label: '✓ Completed' },
    submitted: { bg: '#eff6ff', color: '#1d4ed8', label: '⏳ Submitted' },
    rejected:  { bg: '#fef2f2', color: '#b91c1c', label: '↺ Redo' },
    pending:   { bg: '#fffbeb', color: '#b45309', label: '○ Pending' },
    default:   { bg: '#f1f5f9', color: '#475569', label: '— N/A' },
  };
  const getStatus = (status: string) => statusConfig[status] ?? statusConfig.default;

  const completedCount = tasks.filter(t => taskStatus(t) === 'completed').length;
  const pendingCount   = tasks.filter(t => taskStatus(t) !== 'completed').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .tp-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
        .tp-wrap {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #f1f5f9;
          min-height: 100vh;
          padding: 32px 24px 48px;
        }

        /* Header */
        .tp-header { margin-bottom: 28px; }
        .tp-title-row { display: flex; align-items: center; gap: 14px; margin-bottom: 6px; }
        .tp-title-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .tp-title { font-size: 22px; font-weight: 800; color: #0f172a; }
        .tp-subtitle { font-size: 13px; color: #64748b; margin-left: 56px; }

        /* Stats row */
        .tp-stats { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .tp-stat {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 14px 20px; display: flex; align-items: center; gap: 12px;
          min-width: 140px;
        }
        .tp-stat-icon { font-size: 20px; }
        .tp-stat-val { font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1; }
        .tp-stat-lbl { font-size: 11px; color: #94a3b8; margin-top: 2px; }

        /* Controls */
        .tp-controls {
          display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;
        }
        .tp-search {
          flex: 1; min-width: 200px; position: relative;
        }
        .tp-search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          font-size: 14px; color: #94a3b8; pointer-events: none;
        }
        .tp-search input {
          width: 100%; height: 40px; padding: 0 14px 0 36px;
          border: 1px solid #e2e8f0; border-radius: 10px;
          background: #fff; font-size: 13px; color: #1e293b;
          font-family: inherit; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .tp-search input:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }
        .tp-search input::placeholder { color: #cbd5e1; }
        .tp-select-wrap { position: relative; }
        .tp-select-wrap select {
          height: 40px; padding: 0 36px 0 14px;
          border: 1px solid #e2e8f0; border-radius: 10px;
          background: #fff; font-size: 13px; color: #1e293b;
          font-family: inherit; outline: none; appearance: none;
          cursor: pointer; min-width: 160px;
          transition: border-color 0.15s;
        }
        .tp-select-wrap select:focus { border-color: #93c5fd; }
        .tp-select-arrow {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          font-size: 10px; color: #94a3b8; pointer-events: none;
        }
        .tp-count {
          font-size: 12px; color: #94a3b8; font-weight: 500;
          white-space: nowrap; align-self: center;
        }

        /* Table card */
        .tp-card {
          background: #fff; border-radius: 18px;
          border: 1px solid #e2e8f0; overflow: hidden;
        }
        .tp-table { width: 100%; border-collapse: collapse; }
        .tp-table thead tr {
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
        }
        .tp-table th {
          padding: 12px 16px; font-size: 11px; font-weight: 700;
          color: #64748b; text-transform: uppercase; letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .tp-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.12s;
        }
        .tp-table tbody tr:last-child { border-bottom: none; }
        .tp-table tbody tr:hover { background: #f8fafc; }
        .tp-table td { padding: 14px 16px; vertical-align: middle; }

        .tp-num {
          width: 32px; height: 32px; border-radius: 8px;
          background: #f1f5f9; display: flex; align-items: center;
          justify-content: center; font-size: 12px; font-weight: 700; color: #64748b;
        }
        .tp-task-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .tp-task-desc { font-size: 12px; color: #94a3b8; line-height: 1.5; max-width: 260px; }
        .tp-cat-badge {
          display: inline-block; font-size: 11px; font-weight: 600;
          padding: 3px 10px; border-radius: 20px;
          background: #eff6ff; color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }
        .tp-diff {
          display: inline-block; font-size: 10px; font-weight: 700;
          text-transform: capitalize; padding: 2px 8px; border-radius: 20px;
          margin: 2px 0 4px;
        }
        .tp-diff[data-d="easy"]   { background: #ecfdf5; color: #15803d; }
        .tp-diff[data-d="medium"] { background: #fffbeb; color: #b45309; }
        .tp-diff[data-d="hard"]   { background: #fef2f2; color: #b91c1c; }
        .tp-out-btn {
          background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 5px 10px; font-size: 11px; font-weight: 700; color: #475569;
          cursor: pointer; font-family: inherit; white-space: nowrap;
        }
        .tp-out-btn:hover { background: #e2e8f0; color: #0f172a; }
        .tp-img-thumb {
          width: 48px; height: 48px; border-radius: 10px;
          object-fit: cover; border: 1px solid #e2e8f0; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .tp-img-thumb:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .tp-no-img { font-size: 18px; color: #e2e8f0; }
        .tp-status-pill {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; padding: 4px 10px;
          border-radius: 20px; white-space: nowrap;
        }

        /* Empty state */
        .tp-empty {
          display: flex; flex-direction: column; align-items: center;
          padding: 60px 24px; text-align: center;
        }
        .tp-empty-icon {
          width: 72px; height: 72px; border-radius: 20px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; margin-bottom: 16px;
        }
        .tp-empty-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .tp-empty-desc { font-size: 13px; color: #94a3b8; }

        /* Question + expected-output popup (a real viewport-centered modal) */
        .tp-modal-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(15,23,42,0.66); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: tp-fade 0.15s ease;
        }
        @keyframes tp-fade { from { opacity: 0; } to { opacity: 1; } }
        .tp-modal {
          background: #fff; border-radius: 18px; width: 100%; max-width: 640px;
          max-height: 88vh; display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 30px 70px rgba(15,23,42,0.4);
          animation: tp-rise 0.22s cubic-bezier(.16,1,.3,1);
        }
        @keyframes tp-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .tp-modal-overlay, .tp-modal { animation: none; } }
        .tp-modal-head {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 18px 22px; border-bottom: 1px solid #eef2f7; flex-shrink: 0;
        }
        .tp-modal-eyebrow { font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #7c3aed; margin-bottom: 3px; }
        .tp-modal-title { font-size: 17px; font-weight: 800; color: #0f172a; line-height: 1.3; }
        .tp-modal-x { border: none; background: #f1f5f9; color: #64748b; width: 32px; height: 32px; border-radius: 9px; cursor: pointer; font-size: 14px; flex-shrink: 0; line-height: 1; }
        .tp-modal-x:hover { background: #e2e8f0; color: #0f172a; }
        .tp-modal-body { padding: 18px 22px; overflow-y: auto; }
        .tp-modal-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .tp-modal-section { margin-bottom: 18px; }
        .tp-modal-section:last-child { margin-bottom: 0; }
        .tp-modal-label { font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; }
        .tp-modal-question { font-size: 14px; color: #334155; line-height: 1.65; white-space: pre-wrap; margin: 0; }
        .tp-modal-img { width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; display: block; }
        .tp-modal-iframe { width: 100%; height: 340px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
        .tp-modal-pre { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; overflow-x: auto; white-space: pre-wrap; font-family: ui-monospace,SFMono-Regular,Menlo,monospace; margin: 0; }
        .tp-modal-note { font-size: 14px; color: #475569; margin: 0; }
        .tp-modal-foot { padding: 14px 22px; border-top: 1px solid #eef2f7; display: flex; justify-content: flex-end; flex-shrink: 0; }
        .tp-close-btn {
          background: #f1f5f9; border: none; border-radius: 8px;
          padding: 8px 18px; font-size: 13px; font-weight: 700;
          color: #475569; cursor: pointer; font-family: inherit;
        }
        .tp-close-btn:hover { background: #e2e8f0; color: #0f172a; }
      `}</style>

      <div className="tp-wrap">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div className="tp-header">
            <div className="tp-title-row">
              <div className="tp-title-icon">📝</div>
              <div className="tp-title">My Tasks</div>
            </div>
            <div className="tp-subtitle">All tasks assigned to you by your trainer</div>
          </div>

          {/* Stats */}
          <div className="tp-stats">
            <div className="tp-stat">
              <span className="tp-stat-icon">📋</span>
              <div>
                <div className="tp-stat-val">{tasks.length}</div>
                <div className="tp-stat-lbl">Total tasks</div>
              </div>
            </div>
            <div className="tp-stat">
              <span className="tp-stat-icon">✅</span>
              <div>
                <div className="tp-stat-val" style={{ color: '#16a34a' }}>{completedCount}</div>
                <div className="tp-stat-lbl">Completed</div>
              </div>
            </div>
            <div className="tp-stat">
              <span className="tp-stat-icon">⏳</span>
              <div>
                <div className="tp-stat-val" style={{ color: '#d97706' }}>{pendingCount}</div>
                <div className="tp-stat-lbl">Pending</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="tp-controls">
            <div className="tp-search">
              <span className="tp-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="tp-select-wrap">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {taskCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <span className="tp-select-arrow">▼</span>
            </div>

            <span className="tp-count">
              {filteredTasks.length} of {tasks.length} tasks
            </span>
          </div>

          {/* Table card */}
          <div className="tp-card">

            {filteredTasks.length === 0 ? (
              <div className="tp-empty">
                <div className="tp-empty-icon">📭</div>
                <div className="tp-empty-title">
                  {searchQuery ? 'No tasks match your search' : 'No tasks assigned yet'}
                </div>
                <div className="tp-empty-desc">
                  {searchQuery
                    ? 'Try a different keyword or clear the search.'
                    : 'Your trainer will assign tasks to you soon. Check back later.'}
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 52 }}>#</th>
                      <th>Task</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Output</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task, index) => {
                      const s = getStatus(taskStatus(task));
                      const overdue = isOverdue(task.due_date) && taskStatus(task) !== 'completed';
                      return (
                        <tr key={task.id}>
                          <td>
                            <div className="tp-num">{index + 1}</div>
                          </td>

                          <td>
                            <div className="tp-task-title">{task.title}</div>
                            {task.difficulty && <span className="tp-diff" data-d={task.difficulty}>{task.difficulty}</span>}
                            {task.description && (
                              <div className="tp-task-desc">{task.description}</div>
                            )}
                          </td>

                          <td>
                            <span className="tp-cat-badge">
                              {task.category?.name ?? 'General'}
                            </span>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            {task.output_type === 'image' && task.expected_output_image ? (
                              <img src={task.expected_output_image} alt="Expected output" className="tp-img-thumb" onClick={() => setPreview(task)} />
                            ) : task.output_type === 'preview' && task.expected_output ? (
                              <button className="tp-out-btn" onClick={() => setPreview(task)}>▢ Preview</button>
                            ) : task.output_type === 'text' && task.expected_output ? (
                              <button className="tp-out-btn" onClick={() => setPreview(task)}>{'</> Output'}</button>
                            ) : (
                              <span className="tp-no-img">—</span>
                            )}
                          </td>

                          <td>
                            {fmtDue(task.due_date)
                              ? <span style={{ fontSize: 13, fontWeight: overdue ? 700 : 400, color: overdue ? '#b91c1c' : '#475569' }}>
                                  {fmtDue(task.due_date)}{overdue ? ' · overdue' : ''}
                                </span>
                              : <span className="tp-no-img">—</span>}
                          </td>

                          <td>
                            <span
                              className="tp-status-pill"
                              style={{ background: s.bg, color: s.color }}
                            >
                              {s.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Question + expected-output popup */}
      {preview && (
        <div className="tp-modal-overlay" onClick={() => setPreview(null)}>
          <div className="tp-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="tp-modal-head">
              <div>
                <div className="tp-modal-eyebrow">Practice task</div>
                <h3 className="tp-modal-title">{preview.title}</h3>
              </div>
              <button className="tp-modal-x" onClick={() => setPreview(null)} aria-label="Close">✕</button>
            </div>

            <div className="tp-modal-body">
              {(preview.difficulty || preview.category?.name) && (
                <div className="tp-modal-chips">
                  {preview.difficulty && <span className="tp-diff" data-d={preview.difficulty}>{preview.difficulty}</span>}
                  {preview.category?.name && <span className="tp-cat-badge">{preview.category.name}</span>}
                </div>
              )}

              {preview.description && (
                <div className="tp-modal-section">
                  <div className="tp-modal-label">Question</div>
                  <p className="tp-modal-question">{preview.description}</p>
                </div>
              )}

              <div className="tp-modal-section">
                <div className="tp-modal-label">Expected output</div>
                {preview.output_type === 'image' && preview.expected_output_image ? (
                  <img className="tp-modal-img" src={preview.expected_output_image} alt="Expected output" />
                ) : preview.output_type === 'preview' ? (
                  <iframe title="expected output" sandbox="allow-scripts" srcDoc={preview.expected_output || ''} className="tp-modal-iframe" />
                ) : preview.output_type === 'text' ? (
                  <pre className="tp-modal-pre">{preview.expected_output}</pre>
                ) : (
                  <p className="tp-modal-note">{preview.expected_output || 'No expected output provided for this task.'}</p>
                )}
              </div>
            </div>

            <div className="tp-modal-foot">
              <button className="tp-close-btn" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}