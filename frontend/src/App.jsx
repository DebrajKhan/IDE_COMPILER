import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronRight, Terminal, Plus, Trash2, X, Star } from 'lucide-react';
import MonacoEditorWithCommands from './components/Editor/MonacoEditor';
import { motion } from 'framer-motion';
import MenuBar from './components/MenuBar';
import ActivityBar from './components/ActivityBar';
import StatusBar from './components/StatusBar';
import EditorTabs from './components/EditorTabs';
import ExecutionVisualizer from './components/ExecutionVisualizer/ExecutionVisualizer';
import TerminalPanel from './components/TerminalPanel';
import CollaborationModal from './components/CollaborationModal';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import useExecutionPlayback from './hooks/useExecutionPlayback';
import SciFiBackground from './components/SciFiBackground';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import './index.css';

function App() {
  const defaultFiles = [{ name: 'main.py', content: 'print("Hello World")', language: 'python' }];
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('ide_virtual_files');
    return saved ? JSON.parse(saved) : defaultFiles;
  });
  const [activeFileName, setActiveFileName] = useState(files[0]?.name || 'main.py');
  const activeFile = files.find(f => f.name === activeFileName) || files[0] || defaultFiles[0];

  const [theme, setTheme] = useState(() => localStorage.getItem('ide_theme') || 'default');

  useEffect(() => {
    localStorage.setItem('ide_theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const [code, setCode] = useState(activeFile.content);
  const [language, setLanguage] = useState(activeFile.language);
  const [output, setOutput] = useState('');
  const [execEvents, setExecEvents] = useState([]);
  const [traces, setTraces] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeActivity, setActiveActivity] = useState('explorer');
  const [activeBottomTab, setActiveBottomTab] = useState('output');
  const ws = useRef(null);
  const editorRef = useRef(null);

  // Collaboration State
  const urlParams = new URLSearchParams(window.location.search);
  const initialSessionId = urlParams.get('session');
  const [collabModalOpen, setCollabModalOpen] = useState(!!initialSessionId);
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState('');
  const [participants, setParticipants] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorFontFamily, setEditorFontFamily] = useState("'Cascadia Code', 'Fira Code', Consolas, monospace");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  
  const handleJoinSession = (id, uname) => {
    setSessionId(id);
    setUsername(uname);
    setCollabModalOpen(false);
    window.history.pushState({}, '', `/?session=${id}`);
  };

  const handleExitSession = () => {
    setShowReviewModal(true);
  };

  const submitReviewAndExit = () => {
    // Optionally log or send the review data to a backend
    console.log("User Review:", { rating: reviewRating, feedback: reviewText });
    
    // Clear session and state
    setSessionId(null);
    setUsername('');
    setParticipants([]);
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewText('');
    window.history.pushState({}, '', `/`);
  };

  // Sync virtual workspace metadata (filenames, languages) over Yjs if collaborating
  const workspaceDocRef = useRef(null);
  const workspaceMapRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    const ydoc = new Y.Doc();
    workspaceDocRef.current = ydoc;
    const provider = new WebsocketProvider(`ws://127.0.0.1:8000/ws/yjs/${sessionId}-workspace`, `${sessionId}-workspace`, ydoc);
    const ymap = ydoc.getMap('workspace');
    workspaceMapRef.current = ymap;

    provider.awareness.setLocalStateField('user', {
      name: username || 'Guest',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    });

    const updateParticipants = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setParticipants(states.filter(s => s.user).map(s => s.user));
    };
    provider.awareness.on('change', updateParticipants);
    updateParticipants();

    ymap.observe(() => {
      const syncedFiles = ymap.get('files_metadata');
      if (syncedFiles) {
        setFiles(syncedFiles);
      }
    });
    
    provider.on('sync', (isSynced) => {
      if (isSynced && !ymap.get('files_metadata')) {
         ymap.set('files_metadata', files.map(f => ({ name: f.name, language: f.language }))); // Don't sync full content here
      }
    });

    return () => { 
      provider.awareness.setLocalState(null);
      provider.destroy(); 
      ydoc.destroy(); 
    };
  }, [sessionId]);

  // Sync editor state when switching tabs
  useEffect(() => {
    const file = files.find(f => f.name === activeFileName);
    if (file) {
      setCode(file.content);
      setLanguage(file.language);
    }
  }, [activeFileName, files]);

  // Auto-save active file on code change
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setFiles(prev => {
      const updated = prev.map(f => f.name === activeFileName ? { ...f, content: newCode } : f);
      localStorage.setItem('ide_virtual_files', JSON.stringify(updated));
      return updated;
    });
  };

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
      const wsUrl = sessionId ? `ws://127.0.0.1:8000/ws/execute/${sessionId}` : 'ws://127.0.0.1:8000/ws/execute/local';
      ws.current = new WebSocket(wsUrl);
      ws.current.onopen = () => setWsConnected(true);
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'exec_event') {
          if (data.event.type === 'print_output') {
             setOutput(prev => prev + (data.event.output_text || ''));
          } else if (data.event.type === 'input_request') {
             setOutput(prev => prev + `\x1b[1;33m${data.event.prompt || ''}\x1b[0m`);
          }
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
  }, [sessionId]);

  const handleNewFile = () => {
    if (files.length >= 5) { alert('Maximum of 5 files allowed for guest sessions.'); return; }
    const newName = `untitled${files.length + 1}.py`;
    const newFiles = [...files, { name: newName, content: '', language: 'python' }];
    setFiles(newFiles);
    localStorage.setItem('ide_virtual_files', JSON.stringify(newFiles));
    if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', newFiles.map(f => ({ name: f.name, language: f.language })));
    setActiveFileName(newName);
    setOutput(''); setExecEvents([]); setTraces([]); reset(); 
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.py,.c,.cpp,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (files.length >= 5 && !files.find(f => f.name === file.name)) {
        alert('Maximum of 5 files allowed for guest sessions. Please delete a file first.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => { 
        let lang = 'python';
        if (file.name.endsWith('.c')) lang = 'c';
        else if (file.name.endsWith('.cpp')) lang = 'cpp';
        
        setFiles(prev => {
          let updated = [...prev];
          const existingIdx = updated.findIndex(f => f.name === file.name);
          if (existingIdx >= 0) updated[existingIdx] = { name: file.name, content: ev.target.result, language: lang };
          else updated.push({ name: file.name, content: ev.target.result, language: lang });
          localStorage.setItem('ide_virtual_files', JSON.stringify(updated));
          if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', updated.map(f => ({ name: f.name, language: f.language })));
          return updated;
        });
        setActiveFileName(file.name);
        setExecEvents([]); setTraces([]); reset(); 
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveFile = () => { 
     localStorage.setItem('ide_virtual_files', JSON.stringify(files)); 
     alert('Workspace saved to local storage!'); 
  };

  const handleSaveAs = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = activeFileName;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleRunCode = () => {
    setOutput(''); setExecEvents([]); setTraces([]); reset();
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ code, language }));
      setTimeout(play, 500);
    } else {
      setOutput('⚠ Connecting to server... Please try again in a moment.\n');
      if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
        const wsUrl = sessionId ? `ws://127.0.0.1:8000/ws/execute/${sessionId}` : 'ws://127.0.0.1:8000/ws/execute/local';
        ws.current = new WebSocket(wsUrl);
        ws.current.onopen = () => { setWsConnected(true); setOutput(''); ws.current.send(JSON.stringify({ code, language })); };
        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'exec_event') {
            if (data.event.type === 'print_output') {
               setOutput(prev => prev + (data.event.output_text || ''));
            } else if (data.event.type === 'input_request') {
               setOutput(prev => prev + `\x1b[1;33m${data.event.prompt || ''}\x1b[0m`);
            }
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
    if (id === 'account') {
      setShowAuthModal(true);
      return;
    }
    if (id === 'settings') {
      setShowSettingsModal(true);
      return;
    }
    setActiveActivity(prev => prev === id ? null : id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="ide-shell flex flex-col h-screen w-screen bg-transparent overflow-hidden text-white relative z-0"
    >
      <SciFiBackground />
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        fontSize={editorFontSize}
        setFontSize={setEditorFontSize}
        fontFamily={editorFontFamily}
        setFontFamily={setEditorFontFamily}
      />
      <CollaborationModal 
        isOpen={collabModalOpen} 
        onClose={() => setCollabModalOpen(false)} 
        onJoinSession={handleJoinSession}
        initialSessionId={initialSessionId}
      />
      
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl w-[400px] overflow-hidden flex flex-col p-6">
            <h2 className="text-xl font-bold text-white mb-2">Leave Session</h2>
            <p className="text-gray-400 text-sm mb-6">How was your collaboration experience?</p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setReviewRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    size={32} 
                    className={star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} 
                  />
                </button>
              ))}
            </div>

            <textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us what you liked or what could be improved..."
              className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500 resize-none h-24 mb-6"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2 rounded-lg font-medium bg-[#3c3c3c] hover:bg-[#4d4d4d] text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitReviewAndExit}
                className="flex-1 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}

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
          onCollaborate={() => setCollabModalOpen(true)}
          onExitSession={handleExitSession}
          participants={participants}
          sessionId={sessionId}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      </div>

      {/* Main Workspace: Activity Bar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar + Explorer */}
        <ActivityBar 
          activeItem={activeActivity} 
          onItemClick={handleActivityClick} 
          files={files}
          activeFileName={activeFileName}
          onFileSelect={setActiveFileName}
          onFileCreate={handleNewFile}
          onFileRename={(oldName, newName) => {
            if (oldName === newName) return;
            if (files.some(f => f.name === newName)) { alert('File already exists'); return; }
            setFiles(prev => {
              const updated = prev.map(f => {
                if (f.name === oldName) {
                  let lang = f.language;
                  if (newName.endsWith('.py')) lang = 'python';
                  else if (newName.endsWith('.c')) lang = 'c';
                  else if (newName.endsWith('.cpp')) lang = 'cpp';
                  return { ...f, name: newName, language: lang };
                }
                return f;
              });
              localStorage.setItem('ide_virtual_files', JSON.stringify(updated));
              if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', updated.map(f => ({ name: f.name, language: f.language })));
              return updated;
            });
            if (activeFileName === oldName) setActiveFileName(newName);
          }}
          onFileDelete={(name) => {
            if (files.length <= 1) { alert('Cannot delete the last file.'); return; }
            setFiles(prev => {
              const updated = prev.filter(f => f.name !== name);
              localStorage.setItem('ide_virtual_files', JSON.stringify(updated));
              if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', updated.map(f => ({ name: f.name, language: f.language })));
              if (activeFileName === name) setActiveFileName(updated[0].name);
              return updated;
            });
          }}
        />

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-[1fr_380px] overflow-hidden">

          {/* LEFT: Editor + Terminal */}
          <div className="flex flex-col border-r border-gray-700 overflow-hidden h-full">

            {/* Editor Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <EditorTabs 
                files={files}
                activeFileName={activeFileName}
                onFileSelect={setActiveFileName}
                onFileClose={(name) => {
                  if (files.length <= 1) { alert('Cannot close the last file.'); return; }
                  setFiles(prev => {
                    const updated = prev.filter(f => f.name !== name);
                    localStorage.setItem('ide_virtual_files', JSON.stringify(updated));
                    if (activeFileName === name) setActiveFileName(updated[0].name);
                    return updated;
                  });
                }}
              />

              {/* Editor toolbar / breadcrumb */}
              <div className="border-b border-[#30363d] p-2 flex justify-between bg-[#0d1117]">
                <div className="flex items-center gap-2 px-2">
                  <span className="text-[#8b949e] text-[13px]">src</span>
                  <ChevronRight size={14} className="text-[#6e7681]" />
                  <span className="text-[#c9d1d9] text-[13px]">{activeFileName}</span>
                </div>
                <div className="flex gap-3">
                  <select 
                     value={language} 
                     onChange={(e) => {
                        const newLang = e.target.value;
                        setLanguage(newLang);
                        setFiles(prev => {
                           const updated = prev.map(f => f.name === activeFileName ? { ...f, language: newLang } : f);
                           localStorage.setItem('ide_virtual_files', JSON.stringify(updated));
                           return updated;
                        });
                     }} 
                     className="text-[12px] bg-transparent text-[#c9d1d9] border border-[#30363d] rounded px-2 outline-none cursor-pointer hover:border-[#484f58] transition-colors"
                  >
                    <option value="python">Python 3</option>
                    <option value="c">C (GCC)</option>
                    <option value="cpp">C++ (GCC)</option>
                  </select>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="bg-[#2f81f7] hover:bg-[#1f6feb] text-white px-3 py-1 rounded flex items-center gap-1.5 text-[12px] font-medium transition-colors" 
                    onClick={handleRunCode}
                  >
                    <Play size={12} fill="currentColor" />
                    Run
                  </motion.button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="flex-1 min-h-0 relative">
                <MonacoEditorWithCommands
                  ref={editorRef}
                  language={language}
                  value={code}
                  onCodeChange={handleCodeChange}
                  activeLine={execState.activeLine}
                  editorFontSize={editorFontSize}
                  editorFontFamily={editorFontFamily}
                  sessionId={sessionId}
                  username={username}
                  activeFileName={activeFileName}
                />
              </div>
            </div>

            {/* Terminal Panel */}
            <div className="terminal-section flex flex-col bg-[#1e1e1e] border-t border-gray-700">
              {/* Terminal tab bar */}
              <div className="bottom-panel-header">
                <div className="bottom-panel-tabs">
                  <button 
                    className={`bottom-panel-tab ${activeBottomTab === 'terminal' ? 'active' : ''}`}
                    onClick={() => setActiveBottomTab('terminal')}
                  >
                    TERMINAL
                  </button>
                  <button 
                    className={`bottom-panel-tab ${activeBottomTab === 'output' ? 'active' : ''}`}
                    onClick={() => setActiveBottomTab('output')}
                  >
                    OUTPUT
                  </button>
                  <button className="bottom-panel-tab text-gray-500 cursor-not-allowed">
                    DEBUG CONSOLE
                  </button>
                  <button className="bottom-panel-tab text-gray-500 cursor-not-allowed">
                    PROBLEMS
                    <span className="problems-badge">0</span>
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
              <div className="flex-1 bg-[#0d0d14] relative" style={{ minHeight: 0 }}>
                {/* TERMINAL TAB */}
                <div style={{ display: activeBottomTab === 'terminal' ? 'block' : 'none', height: '100%', width: '100%' }}>
                  <TerminalPanel ws={ws} play={play} output={output} />
                </div>
                {/* OUTPUT TAB */}
                <div style={{ display: activeBottomTab === 'output' ? 'block' : 'none', height: '100%', width: '100%', padding: '12px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#e5e5e5' }}>
                  {output || 'No output generated yet.'}
                </div>
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
    </motion.div>
  );
}

export default App;
