import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  AlertTriangle, Terminal, FileText, MoreHorizontal,
  Plus, ChevronDown, AtSign, Columns2, Trash2,
  Maximize2, X
} from 'lucide-react';

const TABS = [
  { id: 'problems', label: 'Problems' },
  { id: 'output', label: 'Output' },
  { id: 'terminal', label: 'Terminal' },
];

export default function BottomPanel({
  activeTab,
  onTabChange,
  output,
  onClear,
  onMaximize,
  onClose,
  isMaximized,
  panelHeight,
  onHeightChange,
}) {
  const sashRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  /* ---------- Drag-to-resize ---------- */
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    const startY = e.clientY;
    const startH = panelHeight;

    const onMove = (ev) => {
      const delta = startY - ev.clientY;
      const newH = Math.max(100, Math.min(startH + delta, window.innerHeight - 200));
      onHeightChange(newH);
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelHeight, onHeightChange]);

  return (
    <div
      className="ide-bottom-panel"
      style={{ height: isMaximized ? '60vh' : panelHeight }}
    >
      {/* Resize sash */}
      <div
        ref={sashRef}
        className={`bottom-panel-sash ${dragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      />

      {/* Header: tabs on left, actions on right — matches VS Code screenshot */}
      <div className="bottom-panel-header">
        {/* Left: tabs */}
        <div className="bottom-panel-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`bottom-panel-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          {/* ... more button */}
          <button className="panel-action-btn" title="More Views">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Right: action icons matching screenshot */}
        <div className="bottom-panel-actions">
          {/* Shell selector (powershell label) — only when Terminal tab is active */}
          {activeTab === 'terminal' && (
            <>
              <button className="shell-selector" title="Select Shell">
                <Terminal size={14} className="shell-selector-icon" />
                <span>powershell</span>
                <AlertTriangle size={12} style={{ color: '#cca700' }} />
              </button>

              {/* + dropdown */}
              <button className="panel-action-btn" title="New Terminal">
                <Plus size={16} />
              </button>
              <button className="panel-action-btn" style={{ padding: 0, width: 14 }} title="Terminal Type">
                <ChevronDown size={12} />
              </button>

              {/* @ */}
              <button className="panel-action-btn" title="Filter">
                <AtSign size={16} />
              </button>

              {/* Split terminal */}
              <button className="panel-action-btn" title="Split Terminal">
                <Columns2 size={16} />
              </button>

              {/* Delete / Kill terminal */}
              <button className="panel-action-btn" title="Kill Terminal" onClick={onClear}>
                <Trash2 size={16} />
              </button>

              {/* ... more */}
              <button className="panel-action-btn" title="More Actions">
                <MoreHorizontal size={16} />
              </button>

              <div className="panel-action-separator" />
            </>
          )}

          {/* Maximize / Restore */}
          <button className="panel-action-btn" title={isMaximized ? 'Restore' : 'Maximize'} onClick={onMaximize}>
            <Maximize2 size={16} />
          </button>

          {/* Close */}
          <button className="panel-action-btn" title="Close Panel" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bottom-panel-body">
        {activeTab === 'terminal' && (
          <div className="terminal-output">
            {output ? (
              <>
                {output}
                <br />
                <span className="terminal-prompt">○ PS C:\NEWIDEPROJECT&gt; </span>
                <span style={{ 
                  borderLeft: '1.5px solid var(--vsc-terminal-cursor)', 
                  marginLeft: 2, 
                  animation: 'blink 1s step-end infinite',
                  display: 'inline-block',
                  width: 1,
                  height: '1em',
                  verticalAlign: 'text-bottom',
                }} />
              </>
            ) : (
              <>
                <span className="terminal-prompt">○ PS C:\NEWIDEPROJECT&gt; </span>
                <span style={{ 
                  borderLeft: '1.5px solid var(--vsc-terminal-cursor)', 
                  marginLeft: 2, 
                  display: 'inline-block',
                  width: 1,
                  height: '1em',
                  verticalAlign: 'text-bottom',
                  animation: 'blink 1s step-end infinite',
                }} />
              </>
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div className="terminal-output">
            <span className="terminal-ready">No output yet.</span>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="terminal-output">
            <span className="terminal-ready">No problems detected.</span>
          </div>
        )}
      </div>

      {/* Blink animation */}
      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
