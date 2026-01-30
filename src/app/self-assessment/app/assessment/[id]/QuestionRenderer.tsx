
export default function QuestionRenderer({ questions, answers, setAnswers }: any) {
  return (
    <div style={{ padding: 24 }}>
      {questions.map((q: any) => (
        <div
          key={q.id}
          style={{
            background: '#fff',
            padding: 20,
            borderRadius: 16,
            marginBottom: 20,
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          }}
        >
          <h4 style={{ marginBottom: 10 }}>{q.question_text}</h4>

          {q.options.map((o: any) => (
            <label key={o.id} style={{ display: 'block', marginTop: 8 }}>
              <input
                type="radio"
                name={`q-${q.id}`}
                checked={answers[q.id]?.selected_option_id === o.id}
                onChange={() =>
                  setAnswers((a: any) => ({
                    ...a,
                    [q.id]: { selected_option_id: o.id },
                  }))
                }
              />{' '}
              {o.option_text}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
