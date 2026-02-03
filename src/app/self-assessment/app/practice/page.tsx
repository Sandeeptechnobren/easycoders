'use client';
import { useState } from 'react';
import api from '@/lib/axios';
import EasyEditor from './components/EasyEditor';
import EditorHeader from './components/EditorHeader';
import OutputWindow from './components/OutputWindow';
import './practice.css';
export default function PracticePage() {
  const [code, setCode] = useState('// Select a language and start coding');
  const [language, setLanguage] = useState({ id: 62, name: 'java' });
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const handleLanguageSwitch = (newLang: any) => {
    setLanguage(newLang);
    setOutput('');
    if (newLang.name === 'java') {
      setCode('public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Java!");\n  }\n}');
    } else if (newLang.name === 'python') {
      setCode('print("Hello Python!")');
    } else if (newLang.name === 'javascript') {
      setCode('console.log("Hello JavaScript!");');
    }
  };
const runCode = async () => {
  setIsRunning(true);
  setOutput('Running...');
  try {
    const res = await api.post('/EasyAssist/executeCode', 
      {
        source_code: code,
        language: language.name
      }, 
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('assessment_token')}`,
        },
      }
    )
    const { run } = res.data;
    if (run && run.stderr) {
      setOutput(run.stderr);
    } else if (run) {
      setOutput(run.output || "Program executed successfully.");
    } else {
      setOutput("Unexpected response format from server.");
    }
  } catch (err) {
    console.error("Execution Error:", err);
    setOutput('Error: Practice server is temporarily offline.');
  } finally {
    setIsRunning(false);
  }
};
  return (
    <div className="practiceLayout">
      <div className="editorSection">
        <EditorHeader 
          isRunning={isRunning} 
          onRun={runCode} 
          onLanguageChange={handleLanguageSwitch} 
          currentLangId={language.id} 
        />
        <div className="editorContainer">
          <EasyEditor code={code} onChange={setCode} language={language.name} />
        </div>
      </div>
      <div className="outputSection">
        <OutputWindow output={output} />
      </div>
    </div>
  );
}