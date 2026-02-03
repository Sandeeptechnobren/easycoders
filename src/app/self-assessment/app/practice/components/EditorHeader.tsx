'use client';
const languages = [
  { id: 62, name: 'java', label: 'Java (OpenJDK 13)' },
  { id: 63, name: 'javascript', label: 'JavaScript (Node.js 12)' },
  { id: 71, name: 'python', label: 'Python (3.8.1)' },
  { id: 68, name: 'php', label: 'PHP (7.4.1)' },
];
interface HeaderProps {
  onRun: () => void;
  isRunning: boolean;
  onLanguageChange: (lang: any) => void;
  currentLangId: number;
}
export default function EditorHeader({ onRun, isRunning, onLanguageChange, currentLangId }: HeaderProps) {
  return (
    <div className="editorHeader">
      <div className="langSelectorGroup">
        <label htmlFor="langSelect">Language:</label>
        <select 
          id="langSelect"
          value={currentLangId}
          onChange={(e) => {
            const lang = languages.find(l => l.id === parseInt(e.target.value));
            onLanguageChange(lang);
          }}
          className="langDropdown"
        >
          {languages.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </div>
      <button className="runCodeBtn" onClick={onRun} disabled={isRunning}>
        {isRunning ? 'Running...' : '▶ Run Program'}
      </button>
    </div>
  );
}