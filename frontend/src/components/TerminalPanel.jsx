import React, { useEffect, useRef, useState } from 'react';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalPanel = ({ ws, play, output }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  
  // Local state to keep track of the user's input line
  const inputBufferRef = useRef('');
  const previousOutputLength = useRef(0);
  
  // Initialize Xterm
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Xterm({
      theme: {
        background: '#04070D', // Slightly darker than transparent to ensure legibility
        foreground: '#00F5FF',
        cursor: '#00FFA3',
      },
      fontFamily: '"Fira Code", monospace',
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
      allowTransparency: true,
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
    
    // When output resets completely (e.g., Run button clicked), clear the terminal
    if (output === '') {
       term.clear();
       previousOutputLength.current = 0;
       term.writeln("\x1b[38;2;0;245;255m[ NEURAL TERMINAL ONLINE ]\x1b[0m\n\x1b[38;2;139;148;158mRun code to execute neural pathways...\x1b[0m");
       return;
    }

    // Only write the newly added chunk of output
    if (output.length > previousOutputLength.current) {
       const newChunk = output.slice(previousOutputLength.current);
       if (newChunk.includes('❌') || newChunk.toLowerCase().includes('error')) {
          term.write(`\x1b[1;31m${newChunk}\x1b[0m`);
       } else {
          term.write(newChunk);
       }
       previousOutputLength.current = output.length;
    }
  }, [output]);

  return (
    <div className="w-full h-full p-2 bg-transparent sci-fi-glass rounded-lg border border-[#00F5FF]/10 shadow-[inset_0_0_20px_rgba(0,245,255,0.05)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.05)_0%,transparent_100%)] z-0" />
      <div ref={terminalRef} className="w-full h-full relative z-10" />
    </div>
  );
};

export default TerminalPanel;
