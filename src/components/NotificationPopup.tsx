'use client';

import { useEffect, useState } from 'react';
import styles from './NotificationPopup.module.css';

export default function NotificationPopup() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
    }, []);

    if (!show) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <button className={styles.close} onClick={() => setShow(false)}>
                    ✕
                </button>

                <img
                    src="/notification.png"
                    alt="Free Webinar"
                    className={styles.image}
                />

                <h3 className={styles.title}>🚀 Free Webinar</h3>
                <p className={styles.subtitle}>
                    Learn Web development Fundamentals from industry experts.
                </p>
                <a href="https://docs.google.com/forms/d/1Yl5Lk6UT6cZhKSPw5pR9GM9nuok7xyaGTNRzKdBNWw8">
                    <button className={styles.cta}>
                        Register Now
                    </button>
                </a>
            </div>
        </div>
    );
}
