'use client';
import RoleGuard from '@/components/RoleGuard';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import './adminDashboard.css';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const enrollmentData = [
  { day: 'Mon', value: 12 },
  { day: 'Tue', value: 19 },
  { day: 'Wed', value: 8 },
  { day: 'Thu', value: 24 },
  { day: 'Fri', value: 18 },
  { day: 'Sat', value: 30 },
  { day: 'Sun', value: 22 },
];

const categoryData = [
  { name: 'Web Dev', value: 45 },
  { name: 'AI/ML', value: 25 },
  { name: 'Java', value: 15 },
  { name: 'Python', value: 15 },
];

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data));
  }, []);

  return (
    <RoleGuard allowedRoles={[1]}>
    <div className="adminWrapper">
      <div className="adminGrid">
        <div className="adminSidebar">
          <h3>Admin Panel</h3>
          <div className="adminMenu">
            <div className="adminMenuItem" onClick={() => router.push('/admin')}>
              Dashboard
            </div>
            <div className="adminMenuItem" onClick={() => router.push('/admin/addCourse')}>
              Add Course
            </div>
            <div className="adminMenuItem" onClick={() => router.push('/admin/studentManagement')}>
              Students
            </div>
          </div>
        </div>
        <div className="adminMain">
          <div className="adminHero">
            <div>
              <h1>Welcome Admin 👋</h1>
              <p>Here’s what’s happening on EasyCoders today</p>
            </div>
          </div>
          <div className="adminCards">
            <div className="adminCard">
              <h3>Total Students</h3>
              <div className="adminStat">1,240</div>
            </div>
            <div className="adminCard">
              <h3>Total Courses</h3>
              <div className="adminStat">28</div>
            </div>
            <div className="adminCard">
              <h3>New Enrollments</h3>
              <div className="adminStat">+76</div>
            </div>
            <div className="adminCard">
              <h3>Active Today</h3>
              <div className="adminStat">312</div>
            </div>
          </div>

          {/* LINE CHART */}
          <div className="adminCard">
            <h3>Enrollments This Week</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={enrollmentData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* PIE + ACTIVITY */}
          <div className="adminCards">

            <div className="adminCard">
              <h3>Students by Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" innerRadius={60} outerRadius={90}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="adminCard">
              <h3>Recent Activity</h3>
              <ul style={{ marginTop: 10, fontSize: 14 }}>
                <li>🟢 Rahul enrolled in Web Dev</li>
                <li>🟣 New course added: AI Bootcamp</li>
                <li>🔵 5 students completed Java</li>
                <li>🟡 Priya submitted assignment</li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
