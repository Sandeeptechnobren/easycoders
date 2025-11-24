'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import PunchInButton from '@/components/PunchInButton';

export default function StudentDashboard() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tasksRes, ticketsRes] = await Promise.all([
                    api.get('/tasks'),
                    api.get('/tickets')
                ]);
                setTasks(tasksRes.data);
                setTickets(ticketsRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = async () => {
        await api.post('/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Student Dashboard</h1>
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>

            <PunchInButton />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
                    {tasks.length === 0 ? (
                        <p>No tasks assigned yet.</p>
                    ) : (
                        <ul>
                            {tasks.map((task) => (
                                <li key={task.id} className="border-b py-2">
                                    <h3 className="font-bold">{task.title}</h3>
                                    <p className="text-sm text-gray-600">{task.description}</p>
                                    <span className={`text-xs px-2 py-1 rounded ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {task.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">My Courses</h2>
                    <p>Enrolled courses will appear here.</p>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Support Tickets</h2>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    api.post('/tickets', {
                        title: formData.get('title'),
                        description: formData.get('description')
                    }).then(() => window.location.reload());
                }} className="mb-6 space-y-4">
                    <input name="title" placeholder="Issue Title" className="w-full p-2 border rounded" required />
                    <textarea name="description" placeholder="Describe your issue..." className="w-full p-2 border rounded" required></textarea>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Raise Ticket</button>
                </form>

                <h3 className="font-bold mb-2">My Tickets</h3>
                <ul>
                    {tickets.map((ticket) => (
                        <li key={ticket.id} className="border-b py-2">
                            <div className="flex justify-between">
                                <span className="font-bold">{ticket.title}</span>
                                <span className={`text-xs px-2 py-1 rounded ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {ticket.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">{ticket.description}</p>
                            {ticket.trainer_reply && (
                                <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
                                    <strong>Trainer Reply:</strong> {ticket.trainer_reply}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
