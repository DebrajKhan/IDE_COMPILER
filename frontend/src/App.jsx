import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronRight, Terminal, Plus, Trash2, X } from 'lucide-react';
import MonacoEditorWithCommands from './components/Editor/MonacoEditor';
import MenuBar from './components/MenuBar';
import ActivityBar from './components/ActivityBar';
import StatusBar from './components/StatusBar';
import EditorTabs from './components/EditorTabs';
import ExecutionVisualizer from './components/ExecutionVisualizer/ExecutionVisualizer';
import TerminalPanel from './components/TerminalPanel';
import useExecutionPlayback from './hooks/useExecutionPlayback';
import './index.css';

function App() {
  const [code, setCode] = useState(() => localStorage.getItem('saved_code') || 'print("Hello World")');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('python');
  const [execEvents, setExecEvents] = useState([]);
  const [traces, setTraces] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeActivity, setActiveActivity] = useState('explorer');
  const ws = useRef(null);
  const editorRef = useRef(null);

  // Execution playback hook
  const {
    state: execState,
    play, pause, stepForward, stepBack, reset, setSpeed,
  } = useExecutionPlayback(execEvents);

  const handleEditorCommand = (commandId) => {
    if (editorRef.current) editorRef.current.triggerCommand(commandId);
  };

  // WebSocket connection
  useEffect(() => {
    let reconnectTimeout;
    const connectWebSocket = () => {
      if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;
      ws.current = new WebSocket('ws://localhost:8000/ws/execute');
      ws.current.onopen = () => setWsConnected(true);
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'exec_event') {
          setExecEvents(prev => [...prev, data.event]);
        } else if (data.type === 'execution_complete') {
          if (data.has_error) {
            setOutput(prev => prev + '❌ ' + data.output + '\n');
          } else {
            setOutput(prev => prev + data.output);
          }
        } else if (data.type === 'execution_output') {
          setOutput(prev => prev + data.output);
        } else if (data.type === 'array_update') {
          setTraces(prev => [...prev, data.trace_data]);
        }
      };
      ws.current.onclose = () => { setWsConnected(false); reconnectTimeout = setTimeout(connectWebSocket, 2000); };
      ws.current.onerror = () => setWsConnected(false);
    };
    connectWebSocket();
    return () => { clearTimeout(reconnectTimeout); if (ws.current) { ws.current.onclose = null; ws.current.close(); } };
  }, []);

  const handleNewFile = () => { setCode(''); setOutput(''); setExecEvents([]); setTraces([]); reset(); };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.py,.c,.cpp,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { setCode(ev.target.result); setExecEvents([]); setTraces([]); reset(); };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveFile = () => { localStorage.setItem('saved_code', code); alert('Code saved to local storage!'); };

  const handleSaveAs = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `main.${language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'c'}`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleRunCode = () => {
    setOutput(''); setExecEvents([]); setTraces([]); reset();
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ code, language }));
    } else {
      setOutput('⚠ Connecting to server... Please try again in a moment.\n');
      if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
        ws.current = new WebSocket('ws://localhost:8000/ws/execute');
        ws.current.onopen = () => { setWsConnected(true); ws.current.send(JSON.stringify({ code, language })); };
        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'exec_event') {
            setExecEvents(prev => [...prev, data.event]);
          } else if (data.type === 'execution_complete') {
            if (data.has_error) {
              setOutput(prev => prev + '❌ ' + data.output + '\n');
            } else {
              setOutput(prev => prev + data.output);
            }
          } else if (data.type === 'execution_output') {
            setOutput(prev => prev + data.output);
          } else if (data.type === 'array_update') {
            setTraces(prev => [...prev, data.trace_data]);
          }
        };
        ws.current.onclose = () => setWsConnected(false);
      }
    }
  };

  const handleActivityClick = (id) => {
    setActiveActivity(prev => prev === id ? null : id);
  };

  return (
    <div className="ide-shell flex flex-col h-screen w-screen bg-[#1e1e1e] overflow-hidden text-white">
      {/* Menu Bar */}
      <div className="flex-none">
        <MenuBar
          onRunCode={handleRunCode}
          onNewFile={handleNewFile}
          onOpenFile={handleOpenFile}
          onSave={handleSaveFile}
          onSaveAs={handleSaveAs}
          onToggleCurriculum={() => { }}
          onToggleTerminal={() => { }}
          onEditorCommand={handleEditorCommand}
        />
      </div>

      {/* Main Workspace: Activity Bar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar + Explorer */}
        <ActivityBar activeItem={activeActivity} onItemClick={handleActivityClick} />

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-[1fr_380px] overflow-hidden">

          {/* LEFT: Editor + Terminal */}
          <div className="flex flex-col border-r border-gray-700 overflow-hidden h-full">

            {/* Editor Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <EditorTabs language={language} />

              {/* Editor toolbar / breadcrumb */}
              <div className="ide-editor-toolbar border-b border-gray-700 p-2 flex justify-between bg-[#1e1e1e]">
                <div className="editor-toolbar-left flex items-center gap-2">
                  <span className="text-gray-400 text-sm">src</span>
                  <ChevronRight size={14} className="text-gray-500" />
                  <span className="text-gray-300 text-sm font-mono">main.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'c'}</span>
                </div>
                <div className="editor-toolbar-right flex gap-3">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="lang-select text-sm bg-[#2d2d2d] text-white border border-gray-600 rounded px-2 outline-none">
                    <option value="python">Python 3</option>
                    <option value="c">C (GCC)</option>
                    <option value="cpp">C++ (GCC)</option>
                  </select>
                  <button className="btn-run bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm font-bold transition-colors" onClick={handleRunCode}>
                    <Play size={14} fill="currentColor" />
                    Run
                  </button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="flex-1 min-h-0 relative">
                <MonacoEditorWithCommands
                  ref={editorRef}
                  language={language}
                  value={code}
                  onCodeChange={setCode}
                  activeLine={execState.activeLine}
                />
              </div>
            </div>

            {/* Terminal Panel */}
            <div className="terminal-section flex flex-col bg-[#1e1e1e] border-t border-gray-700">
              {/* Terminal tab bar */}
              <div className="bottom-panel-header">
                <div className="bottom-panel-tabs">
                  <button className="bottom-panel-tab active">
                    TERMINAL
                  </button>
                  <button className="bottom-panel-tab">
                    OUTPUT
                  </button>
                  <button className="bottom-panel-tab">
                    DEBUG CONSOLE
                  </button>
                  <button className="bottom-panel-tab">
                    PROBLEMS
                    <span className="problems-badge">2</span>
                  </button>
                </div>
                <div className="bottom-panel-actions">
                  <button className="panel-action-btn" title="New Terminal">
                    <Plus size={16} />
                  </button>
                  <button className="panel-action-btn" title="Kill Terminal">
                    <Trash2 size={16} />
                  </button>
                  <button className="panel-action-btn" title="Close Panel">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-[#0d0d14]" style={{ minHeight: 0 }}>
                <TerminalPanel ws={ws} execState={execState} play={play} output={output} />
              </div>
            </div>
          </div>

          {/* RIGHT: Execution Visualizer */}
          <div className="flex flex-col h-full bg-[#1e1e2e] overflow-hidden">
            <div className="h-full w-full flex flex-col overflow-hidden">
              <ExecutionVisualizer
                execState={execState}
                traces={traces}
                onPlay={play}
                onPause={pause}
                onStepForward={stepForward}
                onStepBack={stepBack}
                onReset={reset}
                onSpeedChange={setSpeed}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-none">
        <StatusBar language={language} wsConnected={wsConnected} />
      </div>
    </div>
  );
}

export default App;
