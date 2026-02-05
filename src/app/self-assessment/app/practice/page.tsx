// 'use client';
// import { useState } from 'react';
// import api from '@/lib/axios';
// import EasyEditor from './components/EasyEditor';
// import EditorHeader from './components/EditorHeader';
// import OutputWindow from './components/OutputWindow';
// import QuestionStatement from './components/QuestionStatement';
// import './practice.css';
// export default function PracticePage() {
//   const [code, setCode] = useState('// Select a language and start coding');
//   const [language, setLanguage] = useState({ id: 62, name: 'java' });
//   const [output, setOutput] = useState('');
//   const [isRunning, setIsRunning] = useState(false);
//   const handleLanguageSwitch = (newLang: any) => {
//     setLanguage(newLang);
//     setOutput('');
//     if (newLang.name === 'java') {
//       setCode('public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Java!");\n  }\n}');
//     } else if (newLang.name === 'python') {
//       setCode('print("Hello Python!")');
//     } else if (newLang.name === 'javascript') {
//       setCode('console.log("Hello JavaScript!");');
//     }
//   };
// const runCode = async () => {
//   setIsRunning(true);
//   setOutput('Running...');
//   try {
//     const res = await api.post('/EasyAssist/executeCode', 
//       {
//         source_code: code,
//         language: language.name
//       }, 
//       {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('assessment_token')}`,
//         },
//       }
//     )
//     const { run } = res.data;
//     if (run && run.stderr) {
//       setOutput(run.stderr);
//     } else if (run) {
//       setOutput(run.output || "Program executed successfully.");
//     } else {
//       setOutput("Unexpected response format from server.");
//     }
//   } catch (err) {
//     console.error("Execution Error:", err);
//     setOutput('Error: Practice server is temporarily offline.');
//   } finally {
//     setIsRunning(false);
//   }
// };
// const [questions, setQuestions] = useState([]);
// const [activeQuestion, setActiveQuestion] = useState(null);

// useEffect(() => {
//   api.get('/coding-questions').then(res => {
//     setQuestions(res.data);
//     if(res.data.length > 0) {
//       setActiveQuestion(res.data[0]);
//       setCode(res.data[0].initial_code);
//     }
//   });
// }, []);

// const handleCheckResult = async (currentOutput: string) => {
//   const solved = currentOutput.trim() === activeQuestion.expected_output.trim();
  
//   // Save record to database for the logged-in user
//   await api.post('/submissions', {
//     question_id: activeQuestion.id,
//     code: code,
//     is_solved: solved
//   }, {
//     headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` }
//   });
// };
//   return (
//     <div className="practiceLayout">
//       <div className="editorSection" >
//         <div className="editorContainer">
//           <EasyEditor code={code} onChange={setCode} language={language.name} />
//         </div>
//         <EditorHeader 
//           isRunning={isRunning} 
//           onRun={runCode} 
//           onLanguageChange={handleLanguageSwitch} 
//           currentLangId={language.id} 
//         />
//       </div>
//       <div className="outputSection">
//         <OutputWindow output={output} />

//       <QuestionStatement />
//       </div>
//     </div>
//   );
// }
'use client';
import { useState, useEffect } from 'react'; // Added useEffect import
import api from '@/lib/axios';
import EasyEditor from './components/EasyEditor';
import EditorHeader from './components/EditorHeader';
import OutputWindow from './components/OutputWindow';
import QuestionStatement from './components/QuestionStatement';
import './practice.css';

interface Question {
  id: number;
  initial_code: string;
  expected_output: string;
  [key: string]: any;
}

export default function PracticePage() {
  const [code, setCode] = useState('// Loading challenge...');
  const [language, setLanguage] = useState({ id: 62, name: 'java' });
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  // Fetch questions on mount
  useEffect(() => {
    api.get('/coding-questions').then(res => {
      setQuestions(res.data);
      if (res.data.length > 0) {
        setActiveQuestion(res.data[0]);
        setCode(res.data[0].initial_code);
      }
    });
  }, []);

  const handleLanguageSwitch = (newLang: any) => {
    setLanguage(newLang);
    setOutput('');
    // If we have an active question, reset to its initial code for the new lang if desired
    // Otherwise, use standard boilerplates
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    try {
      const res = await api.post('/EasyAssist/executeCode', 
        { source_code: code, language: language.name }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` } }
      );

      const { run } = res.data;
      const resultOutput = run?.output || (run?.stderr ? run.stderr : "No output returned.");
      setOutput(resultOutput);

      // Trigger result check if program ran successfully
      if (run && !run.stderr && activeQuestion) {
        handleCheckResult(resultOutput);
      }
    } catch (err) {
      setOutput('Error: Practice server is temporarily offline.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckResult = async (currentOutput: string) => {
    if (!activeQuestion) return;
    
    // Compare output with expected result
    const solved = currentOutput.trim() === activeQuestion.expected_output.trim();
    
    await api.post('/submissions', {
      question_id: activeQuestion.id,
      code: code,
      is_solved: solved
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` }
    });

    if (solved) alert("Success! Problem Solved.");
  };

  return (
    <div className="practiceLayout">
      <div className="editorSection">
        <div className="editorContainer">
          <EasyEditor code={code} onChange={setCode} language={language.name} />
        </div>
        <EditorHeader 
          isRunning={isRunning} 
          onRun={runCode} 
          onLanguageChange={handleLanguageSwitch} 
          currentLangId={language.id} 
        />
      </div>
      <div className="outputSection">
        <OutputWindow output={output} />
        {/* Pass activeQuestion to display the problem details */}
        <QuestionStatement activeQuestion={activeQuestion} />
      </div>
    </div>
  );
}