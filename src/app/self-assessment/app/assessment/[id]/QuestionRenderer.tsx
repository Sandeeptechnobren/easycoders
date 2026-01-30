
import React, { useState, useEffect } from 'react';

export default function QuestionRenderer({ 
  questions, 
  answers, 
  setAnswers, 
  onSubmit, 
  isLastTab, 
  onNextTab 
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

  return (
    <div style={{ padding: '10px', maxWidth: 800, margin: '0 auto' }}>
      <div
        key={currentQuestion.id}
        style={{
          background: '#fff',
          padding: 30,
          borderRadius: 10,
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>
          QUESTION {currentIndex + 1} OF {questions.length}
        </span>
        <h3 style={{ marginTop: 5, marginBottom: 20, color: '#16316b' }}>
          {currentQuestion.question_text}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentQuestion.options.map((o: any) => {
            const isSelected = answers[currentQuestion.id]?.selected_option_id === o.id;
            return (
              <label
                key={o.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 10px',
                  borderRadius: 12,
                  border: isSelected ? '2px solid #16316b' : '1px solid #e5e7eb',
                  background: isSelected ? '#f0f4ff' : '#fff',
                  cursor: 'pointer',
                  transition: '0.2s all',
                }}
              >
                <input
                  type="radio"
                  name={`q-${currentQuestion.id}`}
                  checked={isSelected}
                  onChange={() =>
                    setAnswers((a: any) => ({
                      ...a,
                      [currentQuestion.id]: { selected_option_id: o.id },
                    }))
                  }
                  style={{ marginRight: 12, transform: 'scale(1.2)' }}
                />
                <span style={{ fontSize: '1rem', fontWeight: isSelected ? 600 : 400 }}>
                  {o.option_text}
                </span>
              </label>
            );
          })}
        </div>
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: '1px solid #ddd',
              backgroundColor: currentIndex === 0 ? '#f5f5f5' : '#fff',
              color: '#333',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Back
          </button>

          {isLastQuestionInSection && isLastTab ? (
            <button
              onClick={onSubmit}
              style={{
                padding: '12px 32px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#22c55e',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                padding: '12px 32px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#16316b',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isLastQuestionInSection ? 'Next Section' : 'Save & Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}