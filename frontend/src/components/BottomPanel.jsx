import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  AlertTriangle, Terminal, FileText, MoreHorizontal,
  Plus, ChevronDown, AtSign, Columns2, Trash2,
  Maximize2, X
} from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'problems', label: 'PROBLEMS' },
  { id: 'output', label: 'OUTPUT' },
  { id: 'debug', label: 'DEBUG CONSOLE' },
  { id: 'terminal', label: 'TERMINAL' },
  { id: 'ports', label: 'PORTS' },
  { id: 'comments', label: 'COMMENTS' },
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
      className="ide-bottom-panel flex flex-col bg-transparent border-t border-[#00F5FF]/20 overflow-hidden sci-fi-glass shadow-[0_-10px_20px_rgba(0,245,255,0.05)]"
      style={{ height: isMaximized ? '60vh' : panelHeight }}
    >
      {/* Resize sash */}
      <div
        ref={sashRef}
        className={`h-1 w-full cursor-row-resize hover:bg-[#00F5FF] hover:shadow-[0_0_10px_#00F5FF] transition-all absolute top-0 z-10 ${dragging ? 'bg-[#00F5FF] shadow-[0_0_10px_#00F5FF]' : ''}`}
        onMouseDown={handleMouseDown}
      />

      {/* Header: tabs on left, actions on right */}
      <div className="flex items-center justify-between px-4 pt-2 border-b border-[#00F5FF]/20 select-none bg-black/20">
        {/* Left: tabs */}
        <div className="flex gap-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`relative pb-2 text-[11px] font-bold tracking-[2px] transition-all ${isActive ? 'text-[#00F5FF] drop-shadow-[0_0_5px_#00F5FF]' : 'text-[#8b949e] hover:text-[#00F5FF] hover:drop-shadow-[0_0_5px_#00F5FF]'}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="bottomTabHighlight"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00F5FF] shadow-[0_0_10px_#00F5FF]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: action icons */}
        <div className="flex items-center gap-2 text-[#8b949e] pb-2">
          {activeTab === 'terminal' && (
            <>
              <button className="flex items-center gap-1 hover:text-[#00F5FF] hover:bg-[#00F5FF]/10 px-2 py-0.5 rounded transition-all text-[11px]" title="Select Shell">
                <Terminal size={12} />
                <span>powershell</span>
                <ChevronDown size={12} />
              </button>
              <button className="hover:text-[#00F5FF] p-1 rounded hover:bg-[#00F5FF]/10 hover:shadow-[0_0_10px_rgba(0,245,255,0.2)] transition-all" title="New Terminal">
                <Plus size={14} />
              </button>
              <button className="hover:text-[#FF3E6C] p-1 rounded hover:bg-[#FF3E6C]/10 hover:shadow-[0_0_10px_rgba(255,62,108,0.2)] transition-all" title="Kill Terminal" onClick={onClear}>
                <Trash2 size={14} />
              </button>
            </>
          )}

          {/* Maximize / Restore */}
          <button className="hover:text-[#00F5FF] p-1 rounded hover:bg-[#00F5FF]/10 hover:shadow-[0_0_10px_rgba(0,245,255,0.2)] transition-all" title={isMaximized ? 'Restore' : 'Maximize'} onClick={onMaximize}>
            <Maximize2 size={14} />
          </button>

          {/* Close */}
          <button className="hover:text-[#FF3E6C] p-1 rounded hover:bg-[#FF3E6C]/10 hover:shadow-[0_0_10px_rgba(255,62,108,0.2)] transition-all" title="Close Panel" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 bg-transparent font-mono text-[13px] relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,245,255,0.05)_0%,transparent_70%)]" />
        
        {activeTab === 'terminal' && (
          <div className="text-[#00F5FF] relative z-10" style={{ textShadow: '0 0 5px rgba(0,245,255,0.3)' }}>
            {output ? (
              <pre className="font-mono m-0 whitespace-pre-wrap">{output}</pre>
            ) : null}
            <div className="flex items-center mt-1">
              <span className="text-[#00FFA3] mr-2 filter drop-shadow-[0_0_5px_#00FFA3]">{'>_'}</span>
              <span className="w-2 h-4 bg-[#00F5FF] animate-pulse shadow-[0_0_10px_#00F5FF]" />
            </div>
          </div>
        )}

        {activeTab !== 'terminal' && (
          <div className="text-[#8b949e] flex items-center justify-center h-full">
            No {activeTab} available.
          </div>
        )}
      </div>
    </div>
  );
}
