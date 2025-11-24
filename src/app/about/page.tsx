'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function AboutPage() {
    const [about, setAbout] = useState<any>(null);

    useEffect(() => {
        api.get('/about').then(res => setAbout(res.data));
    }, []);

    if (!about) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-light py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {about.image_url && (
                        <div className="h-64 w-full bg-gray-200 relative">
                            <img src={about.image_url} alt="About Us" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="p-8">
                        <h1 className="text-4xl font-bold text-secondary mb-6">{about.title}</h1>
                        <div className="prose max-w-none text-gray-600 whitespace-pre-line">
                            {about.content}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
