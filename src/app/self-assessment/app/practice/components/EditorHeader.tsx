'use client';

interface EditorHeaderProps {
  title: string;
  onRun: () => void;
  isSaving?: boolean;
}

export default function EditorHeader({ title, onRun, isSaving }: EditorHeaderProps) {
  return (
    <div className="areaHeader">
      <div className="headerInfo">
        <h2>{title}</h2>
        <span className={`badge ${isSaving ? 'saving' : ''}`}>
          {isSaving ? 'Saving...' : 'Draft Saved'}
        </span>
      </div>
      
      <div className="headerActions">
        <button className="runBtn" onClick={onRun}>
          <span className="icon">▶</span> Run Code
        </button>
      </div>

      <style jsx>{`
        .areaHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          background: #fff;
          padding: 10px 15px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .headerInfo { display: flex; align-items: center; gap: 15px; }
        .headerInfo h2 { font-size: 1.2rem; margin: 0; font-weight: 700; }
        .runBtn {
          background: #22c55e;
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .runBtn:hover { background: #16a34a; }
      `}</style>
    </div>
  );
}