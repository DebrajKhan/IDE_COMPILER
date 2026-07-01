import React, { useState, useEffect, useRef } from 'react';
import { Play, Bug, MoreVertical, Search, User, Users, LogOut, Share2, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceChat from './VoiceChat';
import ThemeSelector from './ThemeSelector';

const MENU_DATA = [
  {
    label: 'File',
    items: [
      { label: 'New Text File', shortcut: 'Ctrl+N', action: 'new_file' },
      { label: 'New Window', shortcut: 'Ctrl+Shift+N', action: 'new_window' },
      { type: 'divider' },
      { label: 'Open File...', shortcut: 'Ctrl+O', action: 'open_file' },
      { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: 'stub' },
      { label: 'Open Recent', hasSubmenu: true, action: 'stub' },
      { type: 'divider' },
      { label: 'Save', shortcut: 'Ctrl+S', action: 'save_file' },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: 'save_as' },
      { label: 'Save All', shortcut: 'Ctrl+K S', disabled: true, action: 'stub' },
      { type: 'divider' },
      { label: 'Auto Save', action: 'stub' },
      { label: 'Preferences', hasSubmenu: true, action: 'stub' },
      { type: 'divider' },
      { label: 'Close Editor', shortcut: 'Ctrl+F4', action: 'stub' },
      { label: 'Close Window', shortcut: 'Alt+F4', action: 'close_window' },
      { type: 'divider' },
      { label: 'Exit', action: 'exit' }
    ]
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: 'undo' },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: 'redo' },
      { type: 'divider' },
      { label: 'Cut', shortcut: 'Ctrl+X', action: 'editor.action.clipboardCutAction' },
      { label: 'Copy', shortcut: 'Ctrl+C', action: 'editor.action.clipboardCopyAction' },
      { label: 'Paste', shortcut: 'Ctrl+V', action: 'editor.action.clipboardPasteAction' },
      { type: 'divider' },
      { label: 'Find', shortcut: 'Ctrl+F', action: 'actions.find' },
      { label: 'Replace', shortcut: 'Ctrl+H', action: 'editor.action.startFindReplaceAction' },
      { type: 'divider' },
      { label: 'Toggle Line Comment', shortcut: 'Ctrl+/', action: 'editor.action.commentLine' },
      { label: 'Toggle Block Comment', shortcut: 'Shift+Alt+A', action: 'editor.action.blockComment' },
    ]
  },
  {
    label: 'Selection',
    items: [
      { label: 'Select All', shortcut: 'Ctrl+A', action: 'selectAll' },
      { label: 'Expand Selection', shortcut: 'Shift+Alt+→', action: 'editor.action.smartSelect.expand' },
      { label: 'Shrink Selection', shortcut: 'Shift+Alt+←', action: 'editor.action.smartSelect.shrink' },
      { type: 'divider' },
      { label: 'Copy Line Up', shortcut: 'Shift+Alt+↑', action: 'editor.action.copyLinesUpAction' },
      { label: 'Copy Line Down', shortcut: 'Shift+Alt+↓', action: 'editor.action.copyLinesDownAction' },
      { label: 'Move Line Up', shortcut: 'Alt+↑', action: 'editor.action.moveLinesUpAction' },
      { label: 'Move Line Down', shortcut: 'Alt+↓', action: 'editor.action.moveLinesDownAction' },
      { type: 'divider' },
      { label: 'Add Cursor Above', shortcut: 'Ctrl+Alt+↑', action: 'editor.action.insertCursorAbove' },
      { label: 'Add Cursor Below', shortcut: 'Ctrl+Alt+↓', action: 'editor.action.insertCursorBelow' },
      { label: 'Add Next Occurrence', shortcut: 'Ctrl+D', action: 'editor.action.addSelectionToNextFindMatch' },
      { label: 'Select All Occurrences', action: 'editor.action.selectHighlights' },
    ]
  },
  {
    label: 'View',
    items: [
      { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: 'editor.action.quickCommand' },
      { type: 'divider' },
      { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: 'stub_panel' },
      { label: 'Search', shortcut: 'Ctrl+Shift+F', action: 'stub_panel' },
      { label: 'Terminal', shortcut: 'Ctrl+`', action: 'toggle_terminal' },
      { type: 'divider' },
      { label: 'Curriculum', shortcut: 'Ctrl+B', action: 'toggle_curriculum' },
      { label: 'Word Wrap', shortcut: 'Alt+Z', action: 'editor.action.toggleWordWrap' }
    ]
  },
  {
    label: 'Run',
    items: [
      { label: 'Run Code', action: 'run_code' },
      { label: 'Start Debugging', shortcut: 'F5', action: 'stub' },
      { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: 'stub' }
    ]
  },
  {
    label: 'Terminal',
    items: [
      { label: 'New Terminal', shortcut: 'Ctrl+`', action: 'toggle_terminal' }
    ]
  },
  {
    label: 'Help',
    items: [
      { label: 'About', action: 'stub' }
    ]
  }
];

export default function MenuBar({ onRunCode, onNewFile, onOpenFile, onSave, onSaveAs, onToggleCurriculum, onToggleTerminal, onEditorCommand, onCollaborate, onExitSession, participants = [], sessionId, currentTheme, onThemeChange }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
        setShowProfiles(false);
        setShowCollab(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action, label) => {
    setActiveMenu(null);
    if (action === 'run_code') { onRunCode(); }
    else if (action === 'toggle_curriculum') { if (onToggleCurriculum) onToggleCurriculum(); }
    else if (action === 'toggle_terminal') { if (onToggleTerminal) onToggleTerminal(); }
    else if (action === 'new_file') { onNewFile(); }
    else if (action === 'new_window') { window.open(window.location.href, '_blank'); }
    else if (action === 'open_file' && onOpenFile) { onOpenFile(); }
    else if (action === 'save_file' && onSave) { onSave(); }
    else if (action === 'save_as' && onSaveAs) { onSaveAs(); }
    else if (action === 'close_window' || action === 'exit') {
      window.close();
      setTimeout(() => alert('Browser blocked closing this window.'), 100);
    }
    else if (action === 'stub') { alert(`${label} is not yet implemented.`); }
    else if (action === 'stub_panel') { alert(`The '${label}' panel is not available in this view.`); }
    else { if (onEditorCommand) onEditorCommand(action); }
  };

  const handleMenuHover = (index) => { if (activeMenu !== null) setActiveMenu(index); };
  const toggleMenu = (index) => { setActiveMenu(activeMenu === index ? null : index); };

  return (
    <div className="flex items-center px-4 h-[50px] shrink-0 bg-transparent relative z-50 border-b border-[#00F5FF]/10 select-none" ref={menuRef}>
      {/* App branding */}
      <div className="flex items-center gap-2 mr-6 cursor-pointer">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
          <Code size={20} className="text-[#00F5FF]" />
        </motion.div>
        <span className="text-white font-bold text-sm tracking-widest uppercase" style={{ textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>AlphaCore OS</span>
      </div>

      {/* Menu items */}
      <div className="flex items-center h-full gap-1">
        {MENU_DATA.map((menu, idx) => (
          <div key={idx} className="relative flex items-center h-full">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(0, 245, 255, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleMenu(idx)}
              onMouseEnter={() => handleMenuHover(idx)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold tracking-wide transition-colors ${
                activeMenu === idx ? 'text-[#00F5FF] bg-[#00F5FF]/10 shadow-[0_0_15px_rgba(0,245,255,0.2)]' : 'text-[#8b949e]'
              }`}
            >
              {menu.label}
            </motion.button>

            <AnimatePresence>
            {activeMenu === idx && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 left-0 min-w-[220px] sci-fi-glass rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,245,255,0.15)] z-50 py-2 border border-[#00F5FF]/20"
              >
                {menu.items.map((item, itemIdx) => {
                  if (item.type === 'divider') return <div key={itemIdx} className="h-px bg-[#00F5FF]/10 my-1 mx-2" />;
                  return (
                    <button
                      key={itemIdx}
                      onClick={(e) => { e.stopPropagation(); if (!item.disabled) handleAction(item.action, item.label); }}
                      disabled={item.disabled}
                      className={`w-full text-left px-4 py-1.5 flex justify-between items-center text-[12px] font-medium tracking-wide ${
                        item.disabled ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-[#00F5FF]/10 hover:text-[#00F5FF]'
                      } transition-colors`}
                    >
                      <span>{item.label}</span>
                      <div className="flex items-center gap-3">
                        {item.shortcut && <span className="text-[10px] text-gray-500 font-mono tracking-wider">{item.shortcut}</span>}
                        {item.hasSubmenu && <span className="text-[10px] text-[#00F5FF]">▶</span>}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search bar */}
      <motion.div 
        whileHover={{ scale: 1.02, backgroundColor: "rgba(0,245,255,0.1)", borderColor: "rgba(0,245,255,0.3)" }}
        className="flex items-center gap-2 sci-fi-glass rounded-full px-4 py-1.5 cursor-pointer transition-all w-[300px]"
      >
        <Search size={14} className="text-[#00F5FF] shrink-0" />
        <span className="text-[#8b949e] text-[12px] truncate tracking-wide">SEARCH NEURAL NET...</span>
      </motion.div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* AI Pulse */}
      <div className="flex items-center gap-2 mx-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-[#00FFA3] shadow-[0_0_10px_#00FFA3]"
        />
        <span className="text-[#00FFA3] text-[10px] font-bold tracking-widest uppercase">AI Core Online</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />
        <VoiceChat roomId="global-room" />
        
        {participants.length > 0 && (
          <div className="relative">
            <div 
              className="flex items-center -space-x-2 mr-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowProfiles(!showProfiles)}
            >
              {participants.map((p, idx) => (
                <div 
                  key={idx} 
                  title={p.name}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border border-[#1e1e1e]"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            
            {showProfiles && (
              <div className="absolute right-3 top-full mt-2 w-48 bg-[#252526] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700 uppercase tracking-wider">
                  Participants ({participants.length})
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {participants.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-3 py-2 hover:bg-[#2d2d2d] transition-colors">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: p.color }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-200 truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative mr-1">
          <button 
            className={`font-medium px-3 py-1 rounded-md text-xs flex items-center gap-2 transition-colors ${sessionId ? 'bg-green-600 hover:bg-green-500' : 'bg-[#007acc] hover:bg-[#006bb3]'} text-white`}
            onClick={() => sessionId ? setShowCollab(!showCollab) : onCollaborate()}
          >
            <Users size={14} />
            {sessionId ? 'Session Active' : 'Collaborate'}
          </button>
          
          {showCollab && sessionId && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#252526] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <button 
                onClick={() => { setShowCollab(false); onCollaborate(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-[#2d2d2d] transition-colors text-left"
              >
                <Share2 size={14} className="text-blue-400" />
                Invite Others
              </button>
              <div className="h-[1px] bg-gray-700 w-full" />
              <button 
                onClick={() => { setShowCollab(false); onExitSession(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#2d2d2d] transition-colors text-left"
              >
                <LogOut size={14} />
                Exit Workspace
              </button>
            </div>
          )}
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#2f81f7] hover:bg-[#1f6feb] text-white rounded-md text-[12px] font-medium transition-colors"
          onClick={onRunCode}
        >
          <Play size={14} fill="currentColor" />
          Run
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 px-3 py-1 bg-transparent border border-[#30363d] text-[#c9d1d9] hover:text-white rounded-md text-[12px] font-medium transition-colors"
          onClick={() => alert('Debug is not yet implemented.')}
        >
          <Bug size={14} />
          Debug
        </motion.button>
        <div className="menubar-action-icon hover:bg-[#30363d] rounded-md p-1 cursor-pointer" title="More actions">
          <MoreVertical size={16} className="text-[#8b949e]" />
        </div>
        <div className="ml-1 relative cursor-pointer" title="Account">
          <div className="w-6 h-6 rounded-full bg-[#30363d] flex items-center justify-center text-[12px] font-bold text-[#c9d1d9] border border-[#484f58]">
            A
          </div>
        </div>
      </div>
    </div>
  );
}
