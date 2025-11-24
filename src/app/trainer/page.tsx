'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import PunchInButton from '@/components/PunchInButton';

export default function TrainerDashboard() {
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
                <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>

            <PunchInButton />

            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Assigned Tasks</h2>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">Assign New Task</button>
                </div>
                <ul>
                    {tasks.map((task) => (
                        <li key={task.id} className="border-b py-2">
                            <h3 className="font-bold">{task.title}</h3>
                            <p className="text-sm text-gray-600">Student: {task.student?.name}</p>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">{task.status}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Help Desk</h2>
                <ul>
                    {tickets.map((ticket) => (
                        <li key={ticket.id} className="border-b py-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold">{ticket.title}</h3>
                                    <p className="text-sm text-gray-600">Student: {ticket.student?.name}</p>
                                    <p className="text-gray-700 mt-1">{ticket.description}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {ticket.status}
                                </span>
                            </div>

                            {ticket.status === 'open' && (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    api.put(`/tickets/${ticket.id}`, {
                                        trainer_reply: formData.get('reply'),
                                        status: 'closed'
                                    }).then(() => window.location.reload());
                                }} className="mt-4 flex gap-2">
                                    <input name="reply" placeholder="Write a reply..." className="flex-1 p-2 border rounded" required />
                                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Reply & Close</button>
                                </form>
                            )}
                            {ticket.trainer_reply && (
                                <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
                                    <strong>Reply:</strong> {ticket.trainer_reply}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
