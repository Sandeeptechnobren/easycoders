// 'use client';
// import { useState, useEffect } from 'react';
// import './typingGame.css';

// const PRACTICE_SNIPPETS = [
//   {
//     label: 'Hello World',
//     code: 'console.log("Hello World");',
//   },
//   {
//     label: 'Variable Declaration',
//     code: 'const name = "John";',
//   },
// ];

// export default function MobileResponsiveGame() {
//   const [snippetIndex, setSnippetIndex] = useState(0);
//   const [userInput, setUserInput] = useState('');
//   const [startTime, setStartTime] = useState<number | null>(null);
//   const [isFinished, setIsFinished] = useState(false);
//   const [results, setResults] = useState({ wpm: 0 });

//   const current = PRACTICE_SNIPPETS[snippetIndex];

//   const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const input = e.target.value;
//     if (isFinished) return;

//     if (!startTime && input.length > 0) setStartTime(Date.now());
//     if (input.length > 0 && input[input.length - 1] !== current.code[input.length - 1]) return; 

//     setUserInput(input);

//     if (input === current.code) {
//       const timeElapsed = (Date.now() - startTime!) / 60000;
//       setResults({ wpm: Math.round((current.code.length / 5) / timeElapsed) });
//       setIsFinished(true);
//     }
//   };

//   return (
//     <div className="mobile-game-wrapper">
//       <div className="mobile-header">
//         <h3>{current.label}</h3>
//         <div className="mobile-stats">WPM: {results.wpm}</div>
//       </div>

//       <div className="mobile-code-area">
//         {current.code.split('').map((char, i) => (
//           <span key={i} className={i < userInput.length ? 'char-success' : 'char-wait'}>
//             {char === '\n' ? '↵\n' : char}
//           </span>
//         ))}
//       </div>

//       <div className="mobile-input-section">
//         <textarea
//           className="mobile-textarea"
//           value={userInput}
//           onChange={handleTyping}
//           placeholder="Tap here and start typing..."
//           autoFocus
//           spellCheck="false"
//           autoCorrect="off"
//           autoCapitalize="none"
//         />
//       </div>

//       {isFinished && (
//         <div className="mobile-modal">
//           <div className="modal-content">
//             <h2>Great Job!</h2>
//             <p className="big-stat">{results.wpm} WPM</p>
//             <button className="theme-btn" onClick={() => window.location.reload()}>Next Challenge</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
'use client';
import { useState, useEffect } from 'react';
import './typingGame.css';

export default function GitHubTypingGame() {
  const [current, setCurrent] = useState({ lang: 'Loading...', label: 'Fetching Code...', code: '', url: '#' });
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNewSnippet = async () => {
    setIsLoading(true);
    try {
      // Fetch public gists from GitHub
      const response = await fetch('https://api.github.com/gists/public');
      const gists = await response.json();
      
      // Randomly select a gist and its first file
      const randomGist = gists[Math.floor(Math.random() * gists.length)];
      const firstFile = Object.values(randomGist.files)[0] as any;

      const codeRes = await fetch(firstFile.raw_url);
      const codeText = await codeRes.text();

      // Clean and trim the code for a better mobile experience
      const cleanCode = codeText.substring(0, 250).replace(/\t/g, '  ');

      setCurrent({
        lang: firstFile.language || 'Practice Text',
        label: randomGist.description || 'GitHub Snippet',
        code: cleanCode,
        url: randomGist.html_url // Link to the original Gist
      });

      setUserInput('');
      setStartTime(null);
      setIsFinished(false);
    } catch (error) {
      console.error("Failed to fetch from GitHub", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNewSnippet(); }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    if (isFinished || isLoading) return;

    if (!startTime && input.length > 0) setStartTime(Date.now());
    if (input.length > 0 && input[input.length - 1] !== current.code[input.length - 1]) return; 

    setUserInput(input);

    if (input === current.code) {
      const timeElapsed = (Date.now() - startTime!) / 60000;
      setWpm(Math.round((current.code.length / 5) / timeElapsed));
      setIsFinished(true);
    }
  };

  return (
    <div className="race-mobile-container">
      <div className="race-mobile-header">
        <div className="info-meta">
          <span className="lang-tag">{current.lang}</span>
          <h3>{current.label.substring(0, 30)}...</h3>
          {/* <a href={current.url} target="_blank" rel="noopener noreferrer" className="source-link">
             View Source ↗
          </a> */}
        </div>
        <button className="next-btn" onClick={fetchNewSnippet} disabled={isLoading}>
          {isLoading ? '...' : 'Shuffle'}
        </button>
      </div>

      <div className="race-code-display">
        {isLoading ? (
          <div className="loader">Searching EasyAI...</div>
        ) : (
          current.code.split('').map((char, i) => (
            <span key={i} className={i < userInput.length ? 'hit' : 'miss'}>
              {char === '\n' ? '↵\n' : char}
            </span>
          ))
        )}
      </div>

      <textarea
        className="race-input-field"
        value={userInput}
        onChange={handleTyping}
        placeholder={isLoading ? "Please wait..." : "Type the GitHub code here..."}
        disabled={isLoading || isFinished}
        autoFocus
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="none"
      />

      {isFinished && (
        <div className="race-success-overlay">
          <div className="race-card">
            <h2>Fast Hands!</h2>
            <div className="final-wpm">{wpm} <span>WPM</span></div>
            <button className="primary-btn" onClick={fetchNewSnippet}>Next Race</button>
          </div>
        </div>
      )}
    </div>
  );
}
