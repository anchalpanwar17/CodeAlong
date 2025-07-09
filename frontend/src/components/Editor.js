import React, { useState, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import socket from "../../src/socket";
import { EditorView } from '@codemirror/view';
import { EditorState, Transaction } from '@codemirror/state';
import toast from "react-hot-toast";



const Editor = ({ roomId, username, onCodeChange }) => {
  const [code, setCode] = useState('// Write your C++ code here');
  const isRemoteUpdate = useRef(false);
  const editorRef = useRef(null); // To store the view
  const [lockedLines, setLockedLines] = useState({});



  useEffect(() => {

    const handleCodeSync = ({ code }) => {
      const doc = EditorState.create({ doc: code });
      const lines = doc.doc.toString().split('\n');
      isRemoteUpdate.current = true;
      setCode(code);
      if (onCodeChange) onCodeChange(code);
    }

    const handleCodeChange = ({ code }) => {
      isRemoteUpdate.current = true;
      setCode(code);
      if (onCodeChange) onCodeChange(code);

    }

    socket.on('code-sync', handleCodeSync);

    socket.on('code-change', handleCodeChange);

    socket.on('line-locked', ({ lineNumber, lockedBy }) => {
      if (lockedBy !== username) {
        setLockedLines(prev => ({ ...prev, [lineNumber]: lockedBy }));
      }
    });

    socket.on('line-unlocked', ({ lineNumber }) => {
      setLockedLines(prev => {
        const newLocks = { ...prev };
        delete newLocks[lineNumber];
        return newLocks;
      });
    });


    return () => {
      socket.off('code-sync', handleCodeSync);
      socket.off('code-change', handleCodeChange);
      socket.off('line-locked');

    };

  }, [roomId, username]);

  const shownToastsRef = useRef({}); // Keeps track of shown toasts per line

  const transactionFilter = EditorState.transactionFilter.of((tr) => {
    if (!tr.docChanged) return tr;
    if (isRemoteUpdate.current) return tr;  // allow incoming changes

    const doc = tr.startState.doc;
    let isBlocked = false;

    tr.changes.iterChanges((from, to) => {
      const lineStart = doc.lineAt(from).number;
      const lineEnd = doc.lineAt(to).number;

      for (let line = lineStart; line <= lineEnd; line++) {
        if (lockedLines[line] && lockedLines[line] !== username) {
          if (!shownToastsRef.current[line]) {
            toast(`⛔ Line ${line} is in use by ${lockedLines[line]}`);
            shownToastsRef.current[line] = true;

            setTimeout(() => {
              delete shownToastsRef.current[line];
            }, 3000);
          }
          isBlocked = true;
          return;
        }
      }
    });

    return isBlocked ? [] : tr;
  });



  const extensions = [
    cpp(),
    oneDark,
    transactionFilter,
    EditorView.updateListener.of((viewUpdate) => {
      const newCode = viewUpdate.state.doc.toString();
      const currentLine = viewUpdate.state.doc.lineAt(viewUpdate.state.selection.main.head).number;

      if (!isRemoteUpdate.current) {
        // 🔁 Emit updated code
        socket.emit('code-change', { roomId, code: newCode });

        // 🔒 Lock the current line
        socket.emit('line-lock', { roomId, lineNumber: currentLine, username });

        // 🔓 Release any previously locked lines by this user (except current one)
        socket.emit('release-locks', { roomId, exceptLine: currentLine, username });

        // 🔁 Notify parent
        if (onCodeChange) onCodeChange(newCode);
      }

      isRemoteUpdate.current = false;
    })

  ];

  // const codeChangeFunc = (value, viewUpdate) => {
  //   console.log("✏️ Current code:", value);
  //   setCode(value);

  //   if (onCodeChange) {
  //     onCodeChange(value);  // 🔁 pass code to parent
  //   }
  //   // Get current line being edited
  //   const line = viewUpdate.state.doc.lineAt(viewUpdate.state.selection.main.head).number;

  //   // Send line lock info
  //   socket.emit('line-lock', { roomId, lineNumber: line, username });

  //   if (!isRemoteUpdate.current) {
  //     socket.emit('code-change', { roomId, code: value });
  //   }

  //   isRemoteUpdate.current = false;
  // };



  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <CodeMirror
        value={code}
        style={{ fontSize: '16px' }}
        theme={oneDark}
        extensions={extensions}
        editable={(view) => {
          editorRef.current = view;
          return true;
        }}
      />


    </div>
  );
};

export default Editor;
