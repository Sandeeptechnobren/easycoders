'use client';

import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={[3]}>
      <div className="admin-wrap">
        <div className="container ">
 
        <div className="mb-4">
      

          <h2 className="fw-bold mb-1">
            Welcome back, {user?.name || 'Student'} 👋
          </h2>
          <p className="text-muted mb-0">
            Manage your learning journey
          </p>
        </div>

        {/* Top Cards */}
        <div className="row g-4 mb-4">
          
          {/* Quick Actions */}
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title fw-semibold">
                  Quick Actions
                </h5>
                <p className="text-muted small">
                  Student tools
                </p>

                <div className="list-group list-group-flush mt-3">
                  
                  <Link href="/students/tasks" 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">📝 My Tasks</div>
                      <small className="text-muted">
                        View assigned tasks
                      </small>
                    </div>
                    <span>→</span>
                  </Link>

                  <Link href="/students/tickets" 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">🎫 Support Tickets</div>
                      <small className="text-muted">
                        Get help from trainers
                      </small>
                    </div>
                    <span>→</span>
                  </Link>

                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title fw-semibold">
                  Your Progress
                </h5>
                <p className="text-muted small">
                  Track your learning
                </p>

                <ul className="list-group list-group-flush mt-3">

                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      📚 Courses Enrolled
                      <div className="small text-muted">
                        Continue your learning
                      </div>
                    </div>
                    <span className="badge bg-secondary rounded-pill">
                      Active
                    </span>
                  </li>

                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      ✅ Completed Tasks
                      <div className="small text-muted">
                        Great progress!
                      </div>
                    </div>
                    <span className="badge bg-success rounded-pill">
                      0
                    </span>
                  </li>

                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      ⏰ Pending Tasks
                      <div className="small text-muted">
                        Waiting for completion
                      </div>
                    </div>
                    <span className="badge bg-warning text-dark rounded-pill">
                      0
                    </span>
                  </li>

                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title fw-semibold">
              Recent Activity
            </h5>
            <p className="text-muted small">
              Your latest learning activities
            </p>

            <div className="alert alert-light border text-center mt-3">
              No recent activity. Start by checking your tasks or creating a support ticket.
            </div>
          </div>
        </div>

      </div>
      </div>
    </RoleGuard>
  );
}