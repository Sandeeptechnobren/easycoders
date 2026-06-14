/**
 * Coding-question languages shared by the admin authoring form, the student
 * take-page editor and the trainer review screen.
 *
 *   key    — canonical value stored in the DB (questions.languages[] + the
 *            answer's run_meta.language)
 *   piston — language name sent to the Piston runner (/EasyAssist/executeCode)
 *   monaco — Monaco editor language id for syntax highlighting
 *   starter— default boilerplate when no per-question starter code is set
 *
 * Keep this list in sync with the backend validation in AssessmentController
 * (`in:python,javascript,java,c,cpp`).
 */
export type CodingLangKey = 'python' | 'javascript' | 'java' | 'c' | 'cpp';

export interface CodingLang {
  key: CodingLangKey;
  label: string;
  piston: string;
  monaco: string;
  starter: string;
}

export const CODING_LANGS: Record<CodingLangKey, CodingLang> = {
  python: {
    key: 'python', label: 'Python', piston: 'python', monaco: 'python',
    starter: '# Read input with input() / sys.stdin, print the result\n',
  },
  javascript: {
    key: 'javascript', label: 'JavaScript', piston: 'javascript', monaco: 'javascript',
    starter: '// Read input from stdin, console.log the result\n',
  },
  java: {
    key: 'java', label: 'Java', piston: 'java', monaco: 'java',
    starter:
      'import java.util.*;\n\npublic class Main {\n' +
      '  public static void main(String[] args) {\n' +
      '    Scanner sc = new Scanner(System.in);\n' +
      '    // read input, print output\n' +
      '  }\n}\n',
  },
  c: {
    key: 'c', label: 'C', piston: 'c', monaco: 'c',
    starter:
      '#include <stdio.h>\n\nint main() {\n' +
      '  // read input with scanf, print with printf\n' +
      '  return 0;\n}\n',
  },
  cpp: {
    key: 'cpp', label: 'C++', piston: 'c++', monaco: 'cpp',
    starter:
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n' +
      '  // read input with cin, print with cout\n' +
      '  return 0;\n}\n',
  },
};

export const CODING_LANG_LIST: CodingLang[] = Object.values(CODING_LANGS);

/** Normalise an arbitrary value to a known language key, or null. */
export function toLangKey(value: unknown): CodingLangKey | null {
  const v = String(value ?? '').toLowerCase();
  return (v in CODING_LANGS) ? (v as CodingLangKey) : null;
}
