import React, { useEffect, useRef, useState } from 'react';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalPanel = ({ ws, execState, play, output }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  
  // Local state to keep track of the user's input line
  const inputBufferRef = useRef('');
  
  // Initialize Xterm
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Xterm({
      theme: {
        background: '#0d0d14',
        foreground: '#cccccc',
        cursor: '#ffffff',
      },
      fontFamily: '"Fira Code", monospace',
      fontSize: 14,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Capture user keyboard events
    term.onData((data) => {
      // If we are waiting for input, buffer and echo it locally
      if (data === '\r') {
        // Enter key
        term.writeln('');
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'input_response', value: inputBufferRef.current }));
        }
        inputBufferRef.current = '';
        if (play) play();
      } else if (data === '\u007F') {
        // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else {
        // Printable characters
        inputBufferRef.current += data;
        term.write(data);
      }
    });

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [ws, play]);

  // Sync execution state / output to terminal
  useEffect(() => {
    if (!xtermRef.current) return;
    
    const term = xtermRef.current;
    term.clear();
    
    // Write interactive output
    execState.consoleLines.forEach((line) => {
      if (line.isInputPrompt) {
        term.write(`\x1b[1;33m${line.text}\x1b[0m`); // Bold yellow for prompts
      } else {
        term.writeln(line.text);
      }
    });

    // Write final static output if any (e.g. from C++ or error)
    if (output) {
      term.writeln('');
      // Red for error, standard for output (assumes error if execution had error, but output prop might just be string)
      // If output starts with tracebacks or '❌', color it
      if (output.includes('❌') || output.toLowerCase().includes('error')) {
         term.writeln(`\x1b[1;31m${output}\x1b[0m`);
      } else {
         term.writeln(output);
      }
    }
    
    if (execState.consoleLines.length === 0 && !output) {
      term.writeln("\x1b[38;5;240mRun code to see output here...\x1b[0m");
    }
  }, [execState.consoleLines, output]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d14]">
      {/* Terminal container */}
      <div className="flex-1 w-full h-full p-2 overflow-hidden" ref={terminalRef}></div>
    </div>
  );
};

export default TerminalPanel;
