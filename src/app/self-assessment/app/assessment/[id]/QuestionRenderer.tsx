import React, { useState, useEffect } from 'react';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

export default function QuestionRenderer({
  questions,
  answers,
  setAnswers,
  onSubmit,
  isLastTab,
  onNextTab,
}: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [questions]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestionInSection = currentIndex === questions.length - 1;

  const handleNext = () => {
    if (!isLastQuestionInSection) {
      setCurrentIndex((prev) => prev + 1);
    } else if (!isLastTab) {
      onNextTab();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!currentQuestion) return null;

  const selectedOptionId = answers[currentQuestion.id]?.selected_option_id;

  return (
    <>
      <style>{`
        .qr-wrap {
          padding: 28px 20px 40px;
          max-width: 820px;
          margin: 0 auto;
        }

        /* Question counter strip */
        .qr-counter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .qr-counter-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ede9fe;
          color: #7c3aed;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 999px;
        }
        .qr-dot-nav {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .qr-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          border: 2px solid #e2e8f0;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }
        .qr-dot.answered { background: #22c55e; border-color: #22c55e; }
        .qr-dot.current  { border-color: #7c3aed; background: #ede9fe; }

        /* Card */
        .qr-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(15,23,42,0.06);
        }

        /* Question text */
        .qr-question-text {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        /* Options */
        .qr-options { display: flex; flex-direction: column; gap: 12px; }

        .qr-option {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 14px;
          border: 2px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }
        .qr-option:hover {
          border-color: #c4b5fd;
          background: #faf5ff;
        }
        .qr-option.selected {
          border-color: #7c3aed;
          background: #f5f3ff;
        }

        .qr-option-letter {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
          border: 2px solid #e2e8f0;
          color: #94a3b8;
          background: #f8fafc;
          transition: all 0.2s;
        }
        .qr-option.selected .qr-option-letter {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #fff;
        }
        .qr-option:hover:not(.selected) .qr-option-letter {
          border-color: #c4b5fd;
          color: #7c3aed;
          background: #ede9fe;
        }

        .qr-option-text {
          font-size: 15px;
          color: #334155;
          line-height: 1.5;
          font-weight: 500;
          transition: color 0.2s;
        }
        .qr-option.selected .qr-option-text { color: #4c1d95; font-weight: 600; }

        /* Nav buttons */
        .qr-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
        }
        .qr-nav-left { display: flex; gap: 10px; }

        .qr-btn-back {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 11px 22px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .qr-btn-back:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #334155;
        }
        .qr-btn-back:disabled { opacity: 0.4; cursor: not-allowed; }

        .qr-btn-next {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 28px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(99,102,241,0.3);
        }
        .qr-btn-next:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.4); }

        .qr-btn-submit {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 28px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(34,197,94,0.3);
        }
        .qr-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(34,197,94,0.4); }

        @media (max-width: 600px) {
          .qr-wrap { padding: 16px 12px 32px; }
          .qr-card { padding: 20px 16px; }
          .qr-question-text { font-size: 16px; }
          .qr-option { padding: 12px 14px; }
          .qr-btn-next, .qr-btn-submit { padding: 11px 20px; }
        }
      `}</style>

      <div className="qr-wrap">
        {/* Counter row with dot navigation */}
        <div className="qr-counter-row">
          <span className="qr-counter-badge">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="qr-dot-nav">
            {questions.map((_: any, i: number) => {
              const isAnswered = answers[questions[i]?.id]?.selected_option_id != null;
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={i}
                  className={`qr-dot ${isCurrent ? 'current' : ''} ${isAnswered && !isCurrent ? 'answered' : ''}`}
                  onClick={() => setCurrentIndex(i)}
                  title={`Question ${i + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Question card */}
        <div className="qr-card">
          <p className="qr-question-text">{currentQuestion.question_text}</p>

          <div className="qr-options">
            {currentQuestion.options.map((o: any, idx: number) => {
              const isSelected = selectedOptionId === o.id;
              return (
                <button
                  key={o.id}
                  className={`qr-option ${isSelected ? 'selected' : ''}`}
                  onClick={() =>
                    setAnswers((a: any) => ({
                      ...a,
                      [currentQuestion.id]: { selected_option_id: o.id },
                    }))
                  }
                >
                  <span className="qr-option-letter">{OPTION_LABELS[idx] ?? idx + 1}</span>
                  <span className="qr-option-text">{o.option_text}</span>
                </button>
              );
            })}
          </div>

          <div className="qr-nav">
            <div className="qr-nav-left">
              <button className="qr-btn-back" onClick={handleBack} disabled={currentIndex === 0}>
                ← Back
              </button>
            </div>

            {isLastQuestionInSection && isLastTab ? (
              <button className="qr-btn-submit" onClick={onSubmit}>
                ✓ Submit Assessment
              </button>
            ) : (
              <button className="qr-btn-next" onClick={handleNext}>
                {isLastQuestionInSection ? 'Next Section →' : 'Save & Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
