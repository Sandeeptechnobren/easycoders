'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Permission = { id: number; name: string };
type Role = { name: string; permissions: Permission[] };
type UserSummary = {
  id: number;
  name: string;
  email: string;
  role: string;
  override_count?: number;
  grants?: string[];
  revokes?: string[];
};
type OverrideEntry = {
  permission: string;
  source: 'role' | 'override_grant' | 'override_revoke';
  granted: boolean;
};

export default function PermissionsPage() {
  const [tab, setTab] = useState<'roles' | 'users'>('roles');

  // Role tab state
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [rolePerms, setRolePerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [roleMsg, setRoleMsg] = useState('');

  // Users tab state
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [userOverrides, setUserOverrides] = useState<OverrideEntry[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userMsg, setUserMsg] = useState('');
  const [loadingOverrides, setLoadingOverrides] = useState(false);

  // Load roles + all permissions
  useEffect(() => {
    Promise.all([
      fetchWithAuth(`${BASE}/roles`),
      fetchWithAuth(`${BASE}/permissions`),
    ]).then(([rolesRes, permsRes]) => {
      setRoles(rolesRes.data || []);
      setAllPerms(permsRes.data || []);
    }).catch(() => {});
  }, []);

  // Load users summary
  useEffect(() => {
    if (tab === 'users') {
      fetchWithAuth(`${BASE}/permissions/users-summary`)
        .then(res => setUsers(res.data || []))
        .catch(() => {});
    }
  }, [tab]);

  // When a role is selected load its permissions
  const handleSelectRole = useCallback((roleName: string) => {
    setSelectedRole(roleName);
    setRoleMsg('');
    const found = roles.find(r => r.name === roleName);
    setRolePerms(new Set((found?.permissions || []).map(p => p.name)));
  }, [roles]);

  const toggleRolePerm = (perm: string) => {
    setRolePerms(prev => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  };

  const saveRolePerms = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setRoleMsg('');
    try {
      await fetchWithAuth(`${BASE}/roles/${selectedRole}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: Array.from(rolePerms) }),
      });
      setRoleMsg('Permissions saved successfully.');
      // refresh roles list
      const res = await fetchWithAuth(`${BASE}/roles`);
      setRoles(res.data || []);
    } catch (e: any) {
      setRoleMsg(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // Load user overrides
  const loadUserOverrides = useCallback(async (userId: number, name: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(name);
    setUserMsg('');
    setLoadingOverrides(true);
    try {
      const res = await fetchWithAuth(`${BASE}/users/${userId}/permissions`);
      setUserOverrides(res.data || []);
    } catch {
      setUserOverrides([]);
    } finally {
      setLoadingOverrides(false);
    }
  }, []);

  const setOverride = async (permission: string, type: 'grant' | 'revoke' | 'remove') => {
    if (!selectedUserId) return;
    setUserMsg('');
    try {
      await fetchWithAuth(`${BASE}/users/${selectedUserId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission, type }),
      });
      await loadUserOverrides(selectedUserId, selectedUserName);
      setUserMsg('Override applied.');
    } catch (e: any) {
      setUserMsg(e.message || 'Failed.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const sourceLabel = (entry: OverrideEntry) => {
    if (entry.source === 'override_grant') return <span className="badge bg-success">Override: Grant</span>;
    if (entry.source === 'override_revoke') return <span className="badge bg-danger">Override: Revoke</span>;
    return <span className="badge bg-secondary">Role Default</span>;
  };

  // Group permissions by prefix
  const groupedPerms = allPerms.reduce<Record<string, Permission[]>>((acc, p) => {
    const group = p.name.split('_').slice(0, 2).join('_');
    (acc[group] = acc[group] || []).push(p);
    return acc;
  }, {});

  return (
    <RoleGuard allowedRoles={[1]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Permission Management</h3>
              <p className="text-muted mb-0">Manage role defaults and per-user overrides</p>
            </div>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button className={`nav-link ${tab === 'roles' ? 'active' : ''}`} onClick={() => setTab('roles')}>
                Role Permissions
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
                User Overrides
              </button>
            </li>
          </ul>

          {/* ── Role Permissions Tab ── */}
          {tab === 'roles' && (
            <div className="row g-4">
              {/* Role selector */}
              <div className="col-md-3">
                <div className="card">
                  <div className="card-header fw-semibold">Select Role</div>
                  <div className="list-group list-group-flush">
                    {roles.map(r => (
                      <button
                        key={r.name}
                        className={`list-group-item list-group-item-action ${selectedRole === r.name ? 'active' : ''}`}
                        onClick={() => handleSelectRole(r.name)}
                      >
                        <span className="text-capitalize">{r.name}</span>
                        <span className="badge bg-secondary float-end">{r.permissions.length}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Permission checkboxes */}
              <div className="col-md-9">
                {!selectedRole ? (
                  <div className="card body p-5 text-center text-muted">Select a role to manage its permissions</div>
                ) : (
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <span className="fw-semibold text-capitalize">{selectedRole} — Permissions</span>
                      <div className="d-flex gap-2 align-items-center">
                        {roleMsg && <small className={roleMsg.includes('success') ? 'text-success' : 'text-danger'}>{roleMsg}</small>}
                        <button className="btn btn-sm btn-primary" onClick={saveRolePerms} disabled={saving || selectedRole === 'admin'}>
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                    {selectedRole === 'admin' && (
                      <div className="alert alert-warning m-3 mb-0">Admin role permissions cannot be modified.</div>
                    )}
                    <div className="card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                      {Object.entries(groupedPerms).map(([group, perms]) => (
                        <div key={group} className="mb-3">
                          <div className="text-muted small fw-semibold text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>
                            {group.replace(/_/g, ' ')}
                          </div>
                          <div className="row g-2">
                            {perms.map(p => (
                              <div key={p.name} className="col-md-4">
                                <div
                                  className={`border rounded px-3 py-2 d-flex align-items-center gap-2 ${rolePerms.has(p.name) ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                                  style={{ cursor: selectedRole === 'admin' ? 'default' : 'pointer' }}
                                  onClick={() => selectedRole !== 'admin' && toggleRolePerm(p.name)}
                                >
                                  <input
                                    type="checkbox"
                                    className="form-check-input m-0"
                                    checked={rolePerms.has(p.name)}
                                    readOnly
                                    disabled={selectedRole === 'admin'}
                                  />
                                  <span className="small">{p.name.replace(/_/g, ' ')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── User Overrides Tab ── */}
          {tab === 'users' && (
            <div className="row g-4">
              {/* User list */}
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                  </div>
                  <div className="list-group list-group-flush" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        className={`list-group-item list-group-item-action ${selectedUserId === u.id ? 'active' : ''}`}
                        onClick={() => loadUserOverrides(u.id, u.name)}
                      >
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-semibold">{u.name}</div>
                            <small className={selectedUserId === u.id ? 'text-white-50' : 'text-muted'}>{u.email}</small>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-success me-1">{u.grants?.length ?? 0} +</span>
                            <span className="badge bg-danger">{u.revokes?.length ?? 0} -</span>
                          </div>
                        </div>
                        <small className={`badge ${selectedUserId === u.id ? 'bg-light text-dark' : 'bg-secondary'} mt-1`}>
                          {u.role}
                        </small>
                      </button>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="list-group-item text-muted text-center">No users found</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Override detail */}
              <div className="col-md-8">
                {!selectedUserId ? (
                  <div className="card p-5 text-center text-muted">Select a user to manage their permission overrides</div>
                ) : loadingOverrides ? (
                  <div className="card p-5 text-center text-muted">Loading...</div>
                ) : (
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <span className="fw-semibold">{selectedUserName} — Permission Overrides</span>
                      {userMsg && <small className={userMsg.includes('applied') ? 'text-success' : 'text-danger'}>{userMsg}</small>}
                    </div>
                    <div className="card-body p-0" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>Permission</th>
                            <th>Status</th>
                            <th>Source</th>
                            <th>Override</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userOverrides.map(entry => (
                            <tr key={entry.permission}>
                              <td className="small">{entry.permission.replace(/_/g, ' ')}</td>
                              <td>
                                <span className={`badge ${entry.granted ? 'bg-success' : 'bg-danger'}`}>
                                  {entry.granted ? 'Allowed' : 'Denied'}
                                </span>
                              </td>
                              <td>{sourceLabel(entry)}</td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-success"
                                    title="Force grant"
                                    onClick={() => setOverride(entry.permission, 'grant')}
                                    disabled={entry.source === 'override_grant'}
                                  >
                                    Grant
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    title="Force revoke"
                                    onClick={() => setOverride(entry.permission, 'revoke')}
                                    disabled={entry.source === 'override_revoke'}
                                  >
                                    Revoke
                                  </button>
                                  {entry.source !== 'role' && (
                                    <button
                                      className="btn btn-outline-secondary"
                                      title="Remove override, fall back to role default"
                                      onClick={() => setOverride(entry.permission, 'remove')}
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
