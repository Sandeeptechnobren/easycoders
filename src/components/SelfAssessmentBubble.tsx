// 'use client';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import styles from './SelfAssessmentBubble.module.css';

// export default function SelfAssessmentBubble() {
//   const router = useRouter();
//   const [isOpen, setIsOpen] = useState(false);

//   const bubbleLinks = [
//     { id: 1, label: 'Easy Assess', icon: '🧠', path: '/self-assessment', color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
//     // { id: 2, label: 'Verify Certificate', icon: '📝', path: '/verifyCertificate', color: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
//   ];

//   return (
//     <div className={styles.container}>
//       {isOpen && (
//         <div className={styles.menuList}>
//           {bubbleLinks.map((link) => (
//             <div
//               key={link.id}
//               className={`${styles.assessmentBubble} ${styles.itemEnter}`}
//               style={{ background: link.color }}
//               onClick={() => {
//                 router.push(link.path);
//                 setIsOpen(false);
//               }}
//             >
//               <div className={styles.icon}>{link.icon}</div>
//               <span>{link.label}</span>
//             </div>
//           ))}
//         </div>
//       )}
//       <div 
//         className={`${styles.mainTrigger} ${isOpen ? styles.active : ''}`}
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         {isOpen ? '+' : '🚀 Easy Assess'} 
//       </div>
//     </div>
//   );
// }
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SelfAssessmentBubble.module.css';

export default function SelfAssessmentBubble() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const bubbleLinks = [
    {
      id: 1,
      label: 'Easy Assess',
      icon: '🧠',
      path: '/self-assessment',
      color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    },
    { id: 2, label: 'Verify Certificate', icon: '📝', path: '/verifyCertificate', color: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  ];
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={styles.container} ref={wrapRef}>
      <div className={styles.row}>
        <div className={`${styles.menuSlider} ${isOpen ? styles.menuOpen : ''}`}>
          {bubbleLinks.map((link, idx) => (
            <button
              key={link.id}
              type="button"
              className={styles.menuItem}
              style={{ background: link.color, transitionDelay: isOpen ? `${idx * 60}ms` : '0ms' }}
              onClick={() => {
                router.push(link.path);
                setIsOpen(false);
              }}
            >
              <span className={styles.icon}>{link.icon}</span>
              <span className={styles.itemText}>{link.label}</span>
            </button>
          ))}
        </div>

        {/* MAIN BUBBLE */}
        <button
          type="button"
          className={`${styles.mainTrigger} ${isOpen ? styles.active : ''}`}
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-label="Toggle quick links"
        >
          {isOpen ? '✕' : '🚀 Easy Assess'}
        </button>
      </div>
    </div>
  );
}