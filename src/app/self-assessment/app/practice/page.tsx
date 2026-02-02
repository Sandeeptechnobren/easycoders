'use client';
import { useState } from 'react';
import EasyEditor from './components/EasyEditor';
import EasyAIBox from './components/EasyAIBox';
import './practice.css';

export default function PracticePage() {
  const [code, setCode] = useState('public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Easy Coders!");\n  }\n}');

  return (
    <div className="practicePage">
      <div className="editorArea">
        <div className="areaHeader">
          <h2>Java Practice Lab</h2>
          <span className="badge">Draft Saved</span>
        </div>
        <EasyEditor code={code} onChange={setCode} />
      </div>
      
      <div className="sidebarArea">
        <EasyAIBox currentCode={code} />
      </div>
    </div>
  );
}