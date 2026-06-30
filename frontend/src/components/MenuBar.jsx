import React, { useState, useEffect, useRef } from 'react';
import { Play, Bug, MoreVertical, Search, User } from 'lucide-react';

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

export default function MenuBar({ onRunCode, onNewFile, onOpenFile, onSave, onSaveAs, onToggleCurriculum, onToggleTerminal, onEditorCommand }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
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
    <div className="ide-menubar" ref={menuRef} style={{ fontSize: '13px', userSelect: 'none' }}>
      {/* App branding */}
      <div className="menubar-brand">
        <div className="menubar-brand-icon" />
        <span className="menubar-brand-text">CompilerIDE</span>
      </div>

      {/* Menu items */}
      <div style={{ display: 'flex', height: '100%' }}>
        {MENU_DATA.map((menu, idx) => (
          <div key={idx} style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '100%' }}>
            <button
              onClick={() => toggleMenu(idx)}
              onMouseEnter={() => handleMenuHover(idx)}
              style={{
                padding: '0 8px', height: '80%', display: 'flex', alignItems: 'center',
                borderRadius: 4, margin: '0 1px',
                color: activeMenu === idx ? '#ffffff' : '#cccccc',
                background: activeMenu === idx ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
                transition: 'background 0.1s, color 0.1s',
              }}
              onMouseOver={(e) => { if (activeMenu === null) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseOut={(e) => { if (activeMenu !== idx) e.currentTarget.style.background = 'transparent'; }}
            >
              {menu.label}
            </button>

            {activeMenu === idx && (
              <div className="menu-dropdown fade-in" style={{ position: 'absolute', top: '100%', left: 0 }}>
                {menu.items.map((item, itemIdx) => {
                  if (item.type === 'divider') return <div key={itemIdx} className="menu-divider" />;
                  return (
                    <button
                      key={itemIdx}
                      onClick={(e) => { e.stopPropagation(); if (!item.disabled) handleAction(item.action, item.label); }}
                      disabled={item.disabled}
                      className={`menu-item ${item.disabled ? 'disabled' : ''}`}
                    >
                      <span>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
                        {item.hasSubmenu && <span className="menu-shortcut">▶</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search bar */}
      <div className="menubar-search">
        <Search size={14} style={{ color: '#858585', flexShrink: 0 }} />
        <span className="menubar-search-text">Search files, symbols...</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right actions */}
      <div className="menubar-actions">
        <button className="menubar-run-btn" onClick={onRunCode}>
          <Play size={14} fill="currentColor" />
          Run
        </button>
        <button className="menubar-debug-btn" onClick={() => alert('Debug is not yet implemented.')}>
          <Bug size={14} />
          Debug
        </button>
        <div className="menubar-action-icon" title="More actions">
          <MoreVertical size={18} />
        </div>
        <div className="menubar-action-icon" style={{ marginLeft: 4 }} title="Account">
          <div className="menubar-avatar" />
        </div>
      </div>
    </div>
  );
}
