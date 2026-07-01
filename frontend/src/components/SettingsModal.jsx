import React from 'react';
import { X, Settings, Type, Hash } from 'lucide-react';

const FONT_FAMILIES = [
  { label: 'Sci-Fi (Cascadia Code)', value: "'Cascadia Code', 'Fira Code', Consolas, monospace" },
  { label: 'Classic (Consolas)', value: "Consolas, 'Courier New', monospace" },
  { label: 'Retro (Courier New)', value: "'Courier New', Courier, monospace" },
  { label: 'Standard (Arial)', value: "Arial, Helvetica, sans-serif" },
  { label: 'Professional (Roboto)', value: "Roboto, 'Segoe UI', Tahoma, sans-serif" },
  { label: 'Book (Times New Roman)', value: "'Times New Roman', Times, serif" },
  { label: 'Modern (JetBrains Mono)', value: "'JetBrains Mono', monospace" }
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 22, 24, 28, 32];

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  fontSize, 
  setFontSize, 
  fontFamily, 
  setFontFamily 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-md" onClick={onClose}>
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Modal Container */}
      <div className="relative w-[450px] bg-[#111116]/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col transform transition-all" onClick={(e) => e.stopPropagation()}>
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-cyan-500 hover:text-cyan-300 transition-colors z-10 p-1 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,240,255,0.5)]"
        >
          <X size={18} />
        </button>

        {/* Header Logo */}
        <div className="flex flex-col items-center pt-8 pb-4 px-8 relative z-10 border-b border-cyan-500/20">
          <div className="relative mb-2">
            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-40 rounded-full animate-pulse" />
            <div className="relative bg-[#0a0a0f] p-3 rounded-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Settings size={24} className="text-cyan-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wider uppercase">
            SYS_CONFIG
          </h2>
          <p className="text-cyan-700 text-[10px] font-mono mt-1 uppercase tracking-[0.2em]">Interface Parameters</p>
        </div>

        {/* Form Body */}
        <div className="p-8 relative z-10 space-y-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-cyan-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
              <Type size={14} /> Font Style (Family)
            </label>
            <div className="relative">
              <select 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-[#0a0a0f]/80 border border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-lg px-4 py-3 text-sm text-cyan-50 font-mono outline-none transition-all appearance-none cursor-pointer"
              >
                {FONT_FAMILIES.map(ff => (
                  <option key={ff.value} value={ff.value} style={{ backgroundColor: '#111116', color: '#00F5FF' }}>
                    {ff.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500">▼</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-cyan-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Font Size (Pixels)
            </label>
            <div className="relative">
              <select 
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full bg-[#0a0a0f]/80 border border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-lg px-4 py-3 text-sm text-cyan-50 font-mono outline-none transition-all appearance-none cursor-pointer"
              >
                {FONT_SIZES.map(fs => (
                  <option key={fs} value={fs} style={{ backgroundColor: '#111116', color: '#00F5FF' }}>
                    {fs}px
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500">▼</div>
            </div>
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="border-t border-cyan-900/50 bg-[#0a0a0f]/50 px-8 py-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-mono text-sm tracking-widest rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all uppercase"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
}
