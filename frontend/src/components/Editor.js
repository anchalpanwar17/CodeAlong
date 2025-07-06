import React, { useState, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import socket from "../../src/socket";

const Editor = ({roomId, username}) => {
  const [code, setCode] = useState('// Write your C++ code here');
  const isRemoteUpdate = useRef(false);

  useEffect(() => {

    const handleCodeSync = ({ code }) => {
      isRemoteUpdate.current = true;
      setCode(code);
    }

    const handleCodeChange = ({ code }) => {
      isRemoteUpdate.current = true;
      setCode(code);
    }

    socket.on('code-sync', handleCodeSync );

    socket.on('code-change', handleCodeChange );

    return () => {
      socket.off('code-sync', handleCodeSync);
      socket.off('code-change', handleCodeChange);
    };

  }, [roomId] );

const codeChangeFunc = (value) => {
  setCode(value);
  if(!isRemoteUpdate.current){
    socket.emit('code-change', { roomId, code: value });
  }
  isRemoteUpdate.current = false;
}


return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <CodeMirror
        value={code}
        style={{ fontSize: '16px' }}
        theme={oneDark}
        extensions={[cpp()]}
        onChange={ codeChangeFunc }
      />
    </div>
  );
};

export default Editor;
