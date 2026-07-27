'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/api';

type Course = { id: number; name: string };
type Module = { id: number; title: string; description?: string; order_no: number; topics?: Topic[] };
type Topic = { id: number; title: string; description?: string; order_no: number; subtopics?: Subtopic[] };
type Subtopic = { id: number; title: string; description?: string; order_no: number };

export default function TrainerSyllabusPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Expanded state
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

  // Add forms
  const [addingModule, setAddingModule] = useState(false);
  const [addingTopicFor, setAddingTopicFor] = useState<number | null>(null);
  const [addingSubtopicFor, setAddingSubtopicFor] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${BASE}/courses`)
      .then(res => setCourses(res.data || res || []))
      .catch(() => {});
  }, []);

  const loadSyllabus = useCallback(async (courseId: number) => {
    setLoading(true); setMsg('');
    try {
      const res = await fetchWithAuth(`${BASE}/syllabus/course/${courseId}`);
      setModules(res.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  const handleCourseSelect = (id: number) => {
    setSelectedCourse(id);
    setExpandedModules(new Set());
    setExpandedTopics(new Set());
    loadSyllabus(id);
  };

  const toggleModule = (id: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTopic = (id: number) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const resetForm = () => { setFormTitle(''); setFormDesc(''); };

  const addModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await fetchWithAuth(`${BASE}/syllabus/modules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: selectedCourse, title: formTitle, description: formDesc }),
      });
      resetForm(); setAddingModule(false);
      loadSyllabus(selectedCourse!);
    } catch (e: any) { setMsg(e.message || 'Failed.'); } finally { setSaving(false); }
  };

  const addTopic = async (e: React.FormEvent, moduleId: number) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await fetchWithAuth(`${BASE}/syllabus/topics`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId, title: formTitle, description: formDesc }),
      });
      resetForm(); setAddingTopicFor(null);
      loadSyllabus(selectedCourse!);
    } catch (e: any) { setMsg(e.message || 'Failed.'); } finally { setSaving(false); }
  };

  const addSubtopic = async (e: React.FormEvent, topicId: number) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await fetchWithAuth(`${BASE}/syllabus/subtopics`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, title: formTitle, description: formDesc }),
      });
      resetForm(); setAddingSubtopicFor(null);
      loadSyllabus(selectedCourse!);
    } catch (e: any) { setMsg(e.message || 'Failed.'); } finally { setSaving(false); }
  };

  const deleteModule = async (id: number) => {
    if (!confirm('Delete this module and all its topics?')) return;
    try {
      await fetchWithAuth(`${BASE}/syllabus/modules/${id}`, { method: 'DELETE' });
      loadSyllabus(selectedCourse!);
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  const deleteTopic = async (id: number) => {
    if (!confirm('Delete this topic?')) return;
    try {
      await fetchWithAuth(`${BASE}/syllabus/topics/${id}`, { method: 'DELETE' });
      loadSyllabus(selectedCourse!);
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  const deleteSubtopic = async (id: number) => {
    if (!confirm('Delete this subtopic?')) return;
    try {
      await fetchWithAuth(`${BASE}/syllabus/subtopics/${id}`, { method: 'DELETE' });
      loadSyllabus(selectedCourse!);
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  const InlineForm = ({ onSubmit, onCancel }: { onSubmit: (e: React.FormEvent) => void; onCancel: () => void }) => (
    <form onSubmit={onSubmit} className="border rounded p-3 mt-2 bg-light">
      <div className="mb-2">
        <input className="form-control form-control-sm" placeholder="Title *" required
          value={formTitle} onChange={e => setFormTitle(e.target.value)} />
      </div>
      <div className="mb-2">
        <input className="form-control form-control-sm" placeholder="Description (optional)"
          value={formDesc} onChange={e => setFormDesc(e.target.value)} />
      </div>
      {msg && <div className="text-danger small mb-2">{msg}</div>}
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );

  return (
    <RoleGuard allowedRoles={[4, 1]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Course Syllabus</h3>
              <p className="text-muted mb-0">Manage modules, topics and subtopics</p>
            </div>
          </div>

          {/* Course selector */}
          <div className="mb-4">
            <label className="form-label">Select Course</label>
            <select className="form-select" style={{ maxWidth: 350 }}
              value={selectedCourse || ''}
              onChange={e => e.target.value && handleCourseSelect(Number(e.target.value))}>
              <option value="">— Pick a course —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {!selectedCourse ? (
            <div className="card p-5 text-center text-muted">Select a course to view and edit its syllabus.</div>
          ) : loading ? (
            <div className="text-center py-5 text-muted">Loading...</div>
          ) : (
            <div>
              {/* Add module button */}
              {!addingModule && (
                <button className="btn btn-primary mb-3" onClick={() => { setAddingModule(true); resetForm(); }}>
                  + Add Module
                </button>
              )}
              {addingModule && (
                <div className="mb-3">
                  <InlineForm onSubmit={addModule} onCancel={() => { setAddingModule(false); resetForm(); }} />
                </div>
              )}

              {modules.length === 0 && !addingModule && (
                <div className="card p-4 text-center text-muted">No modules yet. Add the first module.</div>
              )}

              {/* Module list */}
              {modules.map((mod, mi) => (
                <div key={mod.id} className="card mb-3">
                  <div className="card-header d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}
                    onClick={() => toggleModule(mod.id)}>
                    <span className="fw-bold">{mi + 1}. {mod.title}</span>
                    {mod.description && <span className="text-muted small">— {mod.description}</span>}
                    <span className="ms-auto text-muted small">{expandedModules.has(mod.id) ? '▲' : '▼'}</span>
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={e => { e.stopPropagation(); deleteModule(mod.id); }}>
                      Delete
                    </button>
                  </div>

                  {expandedModules.has(mod.id) && (
                    <div className="card-body">
                      {/* Topics */}
                      {(mod.topics || []).map((topic, ti) => (
                        <div key={topic.id} className="border rounded mb-2">
                          <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light"
                            style={{ cursor: 'pointer' }} onClick={() => toggleTopic(topic.id)}>
                            <span className="fw-semibold">{mi + 1}.{ti + 1} {topic.title}</span>
                            {topic.description && <span className="text-muted small">— {topic.description}</span>}
                            <span className="ms-auto text-muted small">{expandedTopics.has(topic.id) ? '▲' : '▼'}</span>
                            <button className="btn btn-sm btn-outline-danger" onClick={e => { e.stopPropagation(); deleteTopic(topic.id); }}>
                              Delete
                            </button>
                          </div>

                          {expandedTopics.has(topic.id) && (
                            <div className="px-4 py-2">
                              {(topic.subtopics || []).map((sub, si) => (
                                <div key={sub.id} className="d-flex align-items-center gap-2 py-1 border-bottom">
                                  <span className="small">{mi + 1}.{ti + 1}.{si + 1} {sub.title}</span>
                                  {sub.description && <span className="text-muted small">— {sub.description}</span>}
                                  <button className="btn btn-sm btn-outline-danger ms-auto py-0" style={{ fontSize: 11 }}
                                    onClick={() => deleteSubtopic(sub.id)}>×</button>
                                </div>
                              ))}

                              {addingSubtopicFor === topic.id ? (
                                <InlineForm onSubmit={e => addSubtopic(e, topic.id)} onCancel={() => { setAddingSubtopicFor(null); resetForm(); }} />
                              ) : (
                                <button className="btn btn-sm btn-outline-secondary mt-2"
                                  onClick={() => { setAddingSubtopicFor(topic.id); resetForm(); }}>
                                  + Add Subtopic
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add topic */}
                      {addingTopicFor === mod.id ? (
                        <InlineForm onSubmit={e => addTopic(e, mod.id)} onCancel={() => { setAddingTopicFor(null); resetForm(); }} />
                      ) : (
                        <button className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => { setAddingTopicFor(mod.id); resetForm(); }}>
                          + Add Topic
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
