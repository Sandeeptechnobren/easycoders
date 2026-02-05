'use client';
import Editor from '@monaco-editor/react';

interface EasyEditorProps {
  code: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function EasyEditor({ code, onChange, language = 'java' }: EasyEditorProps) {
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <Editor
        height="70vh"
        theme="vs-dark"
        defaultLanguage={language}
        value={code}
        onChange={(value) => onChange(value || '')}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
          padding: { top: 10 }
        }}
      />
    </div>
  );
}