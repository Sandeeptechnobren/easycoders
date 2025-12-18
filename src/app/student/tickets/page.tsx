'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Loader from '../../loader/page';

export default function Tickets() {
    const [tickets, setTickets] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get('/tickets').then(res => {
            setTickets(res.data?.data ?? res.data);
            setLoading(false);
        });
    }, []);
    if (loading) return <Loader />;
    return (
        <div>
            <h1>My Tickets</h1>


        </div>
    );
}
