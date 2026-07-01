import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = [
  { id: 'default', name: 'Original Theme', icon: '💻', desc: 'VS Code Dark' },
  { id: 'scifi', name: 'Sci-Fi Command', icon: '🛸', desc: 'Blue holograms, glow' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', icon: '🌃', desc: 'Purple/pink neon' },
  { id: 'space', name: 'Space Explorer', icon: '🌌', desc: 'Stars and galaxy' },
  { id: 'hologram', name: 'AI Hologram', icon: '💠', desc: 'Floating data' },
  { id: 'steampunk', name: 'Steampunk', icon: '⚙️', desc: 'Brass and gears' },
  { id: 'crt', name: 'Retro CRT', icon: '📺', desc: 'Green monochrome' },
  { id: 'matrix', name: 'Matrix Theme', icon: '🕶️', desc: 'Digital rain' },
  { id: 'glass', name: 'Glassmorphism', icon: '🪟', desc: 'Frosted glass' },
  { id: 'dark-hacker', name: 'Dark Hacker', icon: '🥷', desc: 'Minimal terminal' },
  { id: 'event-horizon', name: 'Event Horizon', icon: '🚀', desc: 'MISSION_CTRL theme' },
  { id: 'futuristic', name: 'Cyberdeck Terminal', icon: '🤖', desc: 'Futuristic terminal UI' }
];

export default function ThemeSelector({ currentTheme, onThemeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button 
        whileHover={{ scale: 1.05, backgroundColor: "rgba(0,245,255,0.1)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all border ${isOpen ? 'bg-[#00F5FF]/10 border-[#00F5FF]/50 shadow-[0_0_15px_rgba(0,245,255,0.2)] text-[#00F5FF]' : 'bg-transparent border-[#00F5FF]/20 text-[#8b949e] hover:border-[#00F5FF]/50 hover:text-[#00F5FF] hover:shadow-[0_0_10px_rgba(0,245,255,0.15)]'}`}
        title="Change Theme"
      >
        <Palette size={14} className={isOpen ? "text-[#00F5FF]" : "text-inherit"} />
        <span className="text-[11px] font-bold tracking-widest hidden sm:inline uppercase">Theme</span>
      </motion.button>

      <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full mt-3 right-0 w-[320px] sci-fi-glass border border-[#00F5FF]/30 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(0,245,255,0.15)] z-[100] overflow-hidden p-2 backdrop-blur-xl bg-black/60"
        >
          <div className="px-3 py-2 border-b border-[#00F5FF]/20 mb-2 flex items-center gap-2">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
              <Palette size={14} className="text-[#00F5FF]" />
            </motion.div>
            <h3 className="text-[11px] font-bold text-[#00F5FF] uppercase tracking-[3px]" style={{ textShadow: '0 0 5px rgba(0,245,255,0.5)' }}>
              Aesthetic Matrix
            </h3>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 gap-1.5 pb-2">
            {THEMES.map(theme => {
              const isActive = currentTheme === theme.id;
              return (
                <motion.button
                  whileHover={{ scale: 1.01, backgroundColor: "rgba(0,245,255,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  key={theme.id}
                  onClick={() => {
                    onThemeChange(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex flex-col gap-1 transition-all rounded-lg border ${
                    isActive 
                      ? 'bg-[#00F5FF]/10 border-[#00F5FF]/50 shadow-[inset_0_0_15px_rgba(0,245,255,0.15)]' 
                      : 'bg-black/30 border-transparent hover:border-[#00F5FF]/30'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[12px] font-bold tracking-wide flex items-center gap-2 ${isActive ? 'text-[#00F5FF]' : 'text-[#c9d1d9] group-hover:text-white'}`} style={isActive ? { textShadow: '0 0 5px rgba(0,245,255,0.4)' } : {}}>
                      <span className="text-sm bg-black/40 p-1 rounded border border-[#00F5FF]/10">{theme.icon}</span> 
                      {theme.name}
                    </span>
                    {isActive && (
                      <motion.div layoutId="themeCheck" className="bg-[#00F5FF]/20 p-1 rounded-full shadow-[0_0_10px_rgba(0,245,255,0.3)]">
                        <Check size={12} className="text-[#00F5FF]" style={{ filter: 'drop-shadow(0 0 2px #00F5FF)' }} />
                      </motion.div>
                    )}
                  </div>
                  <span className={`text-[10px] pl-9 tracking-widest font-mono uppercase ${isActive ? 'text-[#00F5FF]/70' : 'text-[#8b949e]'}`}>
                    {theme.desc}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,245,255,0.3); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,245,255,0.6); box-shadow: 0 0 10px rgba(0,245,255,0.5); }
      `}} />
    </div>
  );
}
