import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';

const Editor = () => {
  const [code, setCode] = useState('// Write your C++ code here');

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <CodeMirror
        value={code}
        style={{ fontSize: '16px' }}
        theme={oneDark}
        extensions={[cpp()]}
        onChange={(value) => setCode(value)}
      />
    </div>
  );
};

export default Editor;
