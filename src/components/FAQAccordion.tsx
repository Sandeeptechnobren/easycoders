import { useState } from 'react';

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: 'Who can join Easy Coders programs?',
    answer:
      'Students, recent graduates, and working professionals who want to build real-world coding skills can all join.',
  },
  {
    question: 'Do I need prior coding experience?',
    answer:
      'No. Many of our programs start from the basics and gradually move to advanced, project-based learning.',
  },
  {
    question: 'Will I work on real projects?',
    answer:
      'Yes. You will build hands-on projects that help you practice concepts and strengthen your portfolio.',
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="faqAccordion">
      {faqs.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className={`faqItem ${isOpen ? 'open' : ''}`}
            onClick={() => toggle(index)}
          >
            <div className="faqHeader">
              <h3 className="faqQuestion">{item.question}</h3>
              <span className="faqIcon">{isOpen ? '−' : '+'}</span>
            </div>
            <div className={`faqAnswerWrapper ${isOpen ? 'open' : ''}`}>
              <p className="faqAnswer">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

