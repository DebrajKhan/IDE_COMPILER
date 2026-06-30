import React from 'react';
import { GitBranch } from 'lucide-react';

export default function StatusBar({ language, wsConnected }) {
  const langLabel = language === 'python' ? 'Python' : language === 'cpp' ? 'C++' : 'C';
  const langIcon = language === 'python' ? '🐍' : language === 'cpp' ? '⚡' : '⚙️';

  return (
    <div className="ide-statusbar">
      <div className="statusbar-left">
        <div className="statusbar-item" title="Source Control">
          <GitBranch size={14} />
          <span>main</span>
        </div>
      </div>
      <div className="statusbar-right">
        <div className="statusbar-item" title={`Language: ${langLabel}`}>
          <span>{langIcon}</span>
          <span>{langLabel}</span>
        </div>
        <div className="statusbar-item" title="Encoding">
          <span>UTF-8</span>
        </div>
        <div className="statusbar-item" title={wsConnected ? 'Connected to server' : 'Disconnected'}>
          <div className={`status-dot ${wsConnected ? 'connected' : 'disconnected'}`} />
          <span>{wsConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
}
