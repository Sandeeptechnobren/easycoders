
// 'use client';
// import { useState, useEffect } from 'react';
// import './typingGame.css';

// export default function GitHubTypingGame() {
//   const [current, setCurrent] = useState({ lang: 'Loading...', label: 'Fetching Code...', code: '', url: '#' });
//   const [userInput, setUserInput] = useState('');
//   const [startTime, setStartTime] = useState<number | null>(null);
//   const [isFinished, setIsFinished] = useState(false);
//   const [wpm, setWpm] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);

//   const fetchNewSnippet = async () => {
//     setIsLoading(true);
//     try {
//       // Fetch public gists from GitHub
//       const response = await fetch('https://api.github.com/gists/public');
//       const gists = await response.json();
      
//       // Randomly select a gist and its first file
//       const randomGist = gists[Math.floor(Math.random() * gists.length)];
//       const firstFile = Object.values(randomGist.files)[0] as any;

//       const codeRes = await fetch(firstFile.raw_url);
//       const codeText = await codeRes.text();

//       // Clean and trim the code for a better mobile experience
//       const cleanCode = codeText.substring(0, 250).replace(/\t/g, '  ');

//       setCurrent({
//         lang: firstFile.language || 'Practice Text',
//         label: randomGist.description || 'GitHub Snippet',
//         code: cleanCode,
//         url: randomGist.html_url // Link to the original Gist
//       });

//       setUserInput('');
//       setStartTime(null);
//       setIsFinished(false);
//     } catch (error) {
//       console.error("Failed to fetch from GitHub", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => { fetchNewSnippet(); }, []);

//   const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const input = e.target.value;
//     if (isFinished || isLoading) return;

//     if (!startTime && input.length > 0) setStartTime(Date.now());
//     if (input.length > 0 && input[input.length - 1] !== current.code[input.length - 1]) return; 

//     setUserInput(input);

//     if (input === current.code) {
//       const timeElapsed = (Date.now() - startTime!) / 60000;
//       setWpm(Math.round((current.code.length / 5) / timeElapsed));
//       setIsFinished(true);
//     }
//   };

//   return (
//     <div className="race-mobile-container">
//       <div className="race-mobile-header">
//         <div className="info-meta">
//           <span className="lang-tag">{current.lang}</span>
//           <h3>{current.label.substring(0, 30)}...</h3>
//           {/* <a href={current.url} target="_blank" rel="noopener noreferrer" className="source-link">
//              View Source ↗
//           </a> */}
//         </div>
//         <button className="next-btn" onClick={fetchNewSnippet} disabled={isLoading}>
//           {isLoading ? '...' : 'Shuffle'}
//         </button>
//       </div>

//       <div className="race-code-display">
//         {isLoading ? (
//           <div className="loader">Searching EasyAI...</div>
//         ) : (
//           current.code.split('').map((char, i) => (
//             <span key={i} className={i < userInput.length ? 'hit' : 'miss'}>
//               {char === '\n' ? '↵\n' : char}
//             </span>
//           ))
//         )}
//       </div>

//       <textarea
//         className="race-input-field"
//         value={userInput}
//         onChange={handleTyping}
//         placeholder={isLoading ? "Please wait..." : "Type the GitHub code here..."}
//         disabled={isLoading || isFinished}
//         autoFocus
//         spellCheck="false"
//         autoCorrect="off"
//         autoCapitalize="none"
//       />

//       {isFinished && (
//         <div className="race-success-overlay">
//           <div className="race-card">
//             <h2>Fast Hands!</h2>
//             <div className="final-wpm">{wpm} <span>WPM</span></div>
//             <button className="primary-btn" onClick={fetchNewSnippet}>Next Race</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
'use client';
import { useEffect, useRef, useState } from 'react';
import './typingGame.css';

const TIMES = [30, 60, 120, 300];

export default function TypingGame() {

  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [selectedTime, setSelectedTime] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchText = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        'https://api.easycoders.in/projects/backend/public/api/typing/random'
      );
      const json = await res.json();
      setText(json.data.content);
      resetGame();
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const resetGame = () => {
    setInput('');
    setRemaining(selectedTime);
    setStarted(false);
    setEnded(false);
    setWpm(0);
    setAccuracy(100);
    setTimeout(() => textareaRef.current?.focus(), 200);
  };

  useEffect(() => {
    fetchText();
  }, [selectedTime]);

  const finishTest = () => {
    setEnded(true);
    setStarted(false);
  };

  useEffect(() => {
    if (!started || ended) return;

    if (remaining === 0) {
      finishTest();
      return;
    }

    const timer = setTimeout(() => {
      setRemaining(t => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [remaining, started, ended]);

  const calculateMetrics = (value: string) => {
    const words = value.length / 5;
    const minutes = (selectedTime - remaining) / 60 || 1 / 60;
    setWpm(Math.round(words / minutes));

    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === text[i]) correct++;
    }
    const acc = Math.round((correct / value.length) * 100) || 100;
    setAccuracy(acc);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (ended) return;

    let val = e.target.value;

    if (val.length > text.length) {
      val = val.substring(0, text.length);
    }

    if (!started) setStarted(true);

    setInput(val);
    calculateMetrics(val);

    if (val.length === text.length) {
      finishTest();
    }
  };

  return (
    <div className="typing-wrapper">

      <h1 className="title">⚡ Speed Typing Test</h1>

      <div className="time-selector">
        {TIMES.map(t => (
          <button
            key={t}
            className={selectedTime === t ? 'active' : ''}
            onClick={() => setSelectedTime(t)}
          >
            {t >= 60 ? `${t / 60}m` : `${t}s`}
          </button>
        ))}
      </div>

      <div className="stats">
        <div>⏳ {remaining}s</div>
        <div>🚀 {wpm} WPM</div>
        <div>🎯 {accuracy}%</div>
      </div>

      <div className="text-box">
        {loading
          ? 'Loading typing test...'
          : text.split('').map((char, i) => {
              let cls = '';
              if (i < input.length) {
                cls = char === input[i] ? 'correct' : 'incorrect';
              }
              return (
                <span key={i} className={cls}>
                  {char}
                </span>
              );
            })}
      </div>

      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleTyping}
        disabled={loading || ended}
        maxLength={text.length}
        placeholder="Start typing..."
        spellCheck={false}
      />

      {ended && (
        <div className="result-card">
          <h2>Test Complete 🚀</h2>

          <div className="result-stats">
            <div>
              <span>{wpm}</span>
              WPM
            </div>
            <div>
              <span>{accuracy}</span>
              Accuracy
            </div>
          </div>

          {remaining > 0 && (
            <p className="bonus">
              🔥 Finished with {remaining}s remaining!
            </p>
          )}

          <button onClick={fetchText}>
            New Test
          </button>
        </div>
      )}

    </div>
  );
}
