'use client';
import QuestionStatement from "./QuestionStatement";

export default function OutputWindow({ output }: { output: string }) {
  return (
    <div className="terminalContainer">
      <div className="terminalHeader">Console Output</div>
      <div className="terminalBody">
        <pre className="outputContent">
          {output || '> Output will appear here after running your code...'}
        </pre>
      </div>

    </div>
        
  );
}