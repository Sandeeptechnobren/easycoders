
'use client';
import { useState } from 'react';
import api from '@/lib/axios';

export default function EasyAIBox({ currentCode }: { currentCode: string }) {
  const [userMsg, setUserMsg] = useState('');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('assessment_token');
      const res = await api.post('/EasyAI/getAssistance', {
        question_text: "General Practice Session",
        user_code: currentCode,
        custom_message: userMsg // NEW: Send custom message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHint(res.data.hint);
      setUserMsg(''); // Clear input after asking
    } catch (err) {
      console.error("AI Error:", err);
      setHint("Sorry, EasyAI is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aiContainer">
      <div className="aiInputArea">
        <textarea 
          placeholder="Ask EasyAI anything about your code..."
          value={userMsg}
          onChange={(e) => setUserMsg(e.target.value)}
          rows={3}
          className="customInput"
        />
        <button className="aiBtn" onClick={handleAskAI} disabled={loading}>
          {loading ? 'Analyzing...' : '✨ Ask EasyAI'}
        </button>
      </div>
      
      {hint && (
        <div className="hintBox">
          <div className="hintHeader">EasyAI Trainer</div>
          <p className="hintText">{hint}</p>
        </div>
      )}
    </div>
  );
}