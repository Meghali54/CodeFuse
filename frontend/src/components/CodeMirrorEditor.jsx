import React, { useEffect } from 'react'
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
//import { dracula } from "@codemirror/theme-dracula";


const CodeMirrorEditor = () => {

    const [code, setCode] = useState(
    `function add(a, b) {\n  return a + b;\n}`
  );

  return (
    <CodeMirror
      value={code}
      height="300px"
      extensions={[javascript()]}
     // theme={dracula}
      onChange={(value) => setCode(value)}
    />
  )
}

export default CodeMirrorEditor
