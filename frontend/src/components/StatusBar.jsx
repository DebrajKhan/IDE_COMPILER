import React from 'react';
import { GitBranch } from 'lucide-react';

export default function StatusBar({ language, wsConnected }) {
  const langLabel = language === 'python' ? 'Python' : language === 'cpp' ? 'C++' : 'C';
  const langIcon = language === 'python' ? '🐍' : language === 'cpp' ? '⚡' : '⚙️';

  return (
    <div className="flex items-center justify-between h-[30px] bg-transparent sci-fi-glass border-t border-[#00F5FF]/20 text-[#00F5FF] px-4 text-[11px] font-bold tracking-widest select-none shadow-[0_-5px_15px_rgba(0,245,255,0.1)]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-[#00F5FF]/20 px-2 py-0.5 rounded transition-all hover:shadow-[0_0_10px_rgba(0,245,255,0.2)]" title="Source Control">
          <GitBranch size={12} className="text-[#00FFA3]" />
          <span style={{ textShadow: '0 0 5px rgba(0,245,255,0.5)' }}>NEURAL-NET-MAIN</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-[#00F5FF]/20 px-2 py-0.5 rounded transition-all hover:shadow-[0_0_10px_rgba(0,245,255,0.2)]" title={`Language: ${langLabel}`}>
          <span className="text-[#00FFA3]" style={{ filter: 'drop-shadow(0 0 5px #00FFA3)' }}>{langIcon}</span>
          <span>{langLabel.toUpperCase()} CORE</span>
        </div>
        <div className="cursor-pointer hover:bg-[#00F5FF]/20 px-2 py-0.5 rounded transition-all hover:shadow-[0_0_10px_rgba(0,245,255,0.2)]" title="Encoding">
          <span>UTF-8-SEQ</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-[#00F5FF]/20 px-2 py-0.5 rounded transition-all hover:shadow-[0_0_10px_rgba(0,245,255,0.2)]" title={wsConnected ? 'Connected to server' : 'Disconnected'}>
          <div className="relative flex h-2 w-2">
            {wsConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFA3] opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${wsConnected ? 'bg-[#00FFA3] shadow-[0_0_5px_#00FFA3]' : 'bg-[#FF3E6C] shadow-[0_0_5px_#FF3E6C]'}`}></span>
          </div>
          <span className={wsConnected ? 'text-[#00FFA3]' : 'text-[#FF3E6C]'}>
            {wsConnected ? 'LINK ACTIVE' : 'LINK SEVERED'}
          </span>
        </div>
      </div>
    </div>
  );
}
