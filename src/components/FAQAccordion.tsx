'use client';
import { useState } from 'react';

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: 'Who can join Easy Coders programs?',
    answer: 'Students, recent graduates, and working professionals who want to build real-world coding skills can all join. Our programs are designed to accommodate all backgrounds and learning paces.',
  },
  {
    question: 'Do I need prior coding experience?',
    answer: 'No prior experience is needed. Many of our programs start from the very basics and gradually move to advanced, project-based learning — so you are always building on solid foundations.',
  },
  {
    question: 'Will I work on real projects?',
    answer: 'Yes. You will build hands-on projects that mirror real industry work. These projects strengthen your portfolio and give you tangible skills employers actually look for.',
  },
  {
    question: 'What is the placement support like?',
    answer: 'We offer dedicated placement assistance including resume review, mock interviews, and direct referrals to our hiring partner network. Our current placement rate is 98%.',
  },
  {
    question: 'Are there flexible batch timings?',
    answer: 'Yes. We offer morning, evening, and weekend batches to accommodate students and working professionals. Online modes are also available for all programs.',
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <>
      <style>{`
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .faq-row {
          border-bottom: 1px solid #E2E8F0;
          overflow: hidden;
        }

        .faq-row:first-child {
          border-top: 1px solid #E2E8F0;
        }

        .faq-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 4px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: color 0.2s;
        }

        .faq-trigger:hover .faq-q {
          color: #1A56DB;
        }

        .faq-q {
          font-size: 16px;
          font-weight: 500;
          color: #0B1B3A;
          line-height: 1.4;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }

        .faq-q.open-q {
          color: #1A56DB;
        }

        .faq-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #4A5568;
          transition: all 0.25s;
          line-height: 1;
        }

        .faq-icon.open-icon {
          background: #0B1B3A;
          border-color: #0B1B3A;
          color: #E8A020;
          transform: rotate(45deg);
        }

        .faq-body {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s ease, padding 0.3s ease;
        }

        .faq-body.open-body {
          max-height: 200px;
        }

        .faq-answer {
          font-size: 15px;
          color: #4A5568;
          line-height: 1.75;
          font-weight: 300;
          padding: 0 4px 22px;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <div className="faq-list">
        {faqs.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div className="faq-row" key={item.question}>
              <button
                className="faq-trigger"
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
              >
                <span className={`faq-q ${isOpen ? 'open-q' : ''}`}>
                  {item.question}
                </span>
                <span className={`faq-icon ${isOpen ? 'open-icon' : ''}`}>+</span>
              </button>
              <div className={`faq-body ${isOpen ? 'open-body' : ''}`}>
                <p className="faq-answer">{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}