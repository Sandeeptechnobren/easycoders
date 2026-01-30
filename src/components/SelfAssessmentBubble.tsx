'use client';

import { useRouter } from 'next/navigation';
import styles from './SelfAssessmentBubble.module.css';

export default function SelfAssessmentBubble() {
  const router = useRouter();

  return (
    <div
      className={styles.assessmentBubble}
      onClick={() => router.push('/self-assessment')}
    >
      <div className={styles.icon}>🧠</div>
      <span>Self Assessment</span>
    </div>
  );
}
