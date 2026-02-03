// 'use client';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import styles from './SelfAssessmentBubble.module.css';
// export default function SelfAssessmentBubble() {
//   const router = useRouter();
//   const [isOpen, setIsOpen] = useState(false);
//   const bubbleLinks = [
//     { id: 1, label: 'Easy Assess', icon: '🧠', path: '/self-assessment', color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
//     { id: 2, label: 'Verify Certificate', icon: '📝', path: '/verifyCertificate', color: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
//     // { id: 3, label: 'Resume Help', icon: '📄', path: '/resume', color: 'linear-gradient(135deg, #10B981, #059669)' },
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
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SelfAssessmentBubble.module.css';

export default function SelfAssessmentBubble() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const bubbleLinks = [
    { id: 1, label: 'Easy Assess', icon: '🧠', path: '/self-assessment', color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
    { id: 2, label: 'Verify Certificate', icon: '📝', path: '/verifyCertificate', color: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  ];

  return (
    <div className={styles.container}>
      {isOpen && (
        <div className={styles.menuList}>
          {bubbleLinks.map((link) => (
            <div
              key={link.id}
              className={`${styles.assessmentBubble} ${styles.itemEnter}`}
              style={{ background: link.color }}
              onClick={() => {
                router.push(link.path);
                setIsOpen(false);
              }}
            >
              <div className={styles.icon}>{link.icon}</div>
              <span>{link.label}</span>
            </div>
          ))}
        </div>
      )}
      <div 
        className={`${styles.mainTrigger} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '+' : '🚀 Easy Assess'} 
      </div>
    </div>
  );
}