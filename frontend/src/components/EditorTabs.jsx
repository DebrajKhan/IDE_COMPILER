import React from 'react';
import { FileCode, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANG_COLORS = { python: '#3572a5', c: '#555555', cpp: '#f34b7d' };

export default function EditorTabs({ files, activeFileName, onFileSelect, onFileClose }) {
  const getFileIcon = (name) => {
    if (!name) return { icon: FileCode, color: '#cccccc' };
    if (name.endsWith('.py')) return { icon: FileCode, color: '#3572a5' };
    if (name.endsWith('.c') || name.endsWith('.cpp')) return { icon: FileCode, color: '#f34b7d' };
    return { icon: FileCode, color: '#e8a427' }; // fallback for json/others
  };

  return (
    <div className="flex bg-transparent border-b border-[#00F5FF]/20 overflow-x-auto h-[45px] shrink-0 pt-2 px-2 gap-1">
      <AnimatePresence>
      {files && files.map((file) => {
        const isActive = file.name === activeFileName;
        const fileIcon = getFileIcon(file.name);
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            key={file.name} 
            className={`flex items-center gap-2 px-4 py-1.5 text-[12px] rounded-t-lg font-medium tracking-wide cursor-pointer select-none relative group transition-all border border-b-0 ${isActive ? 'sci-fi-glass text-white border-[#00F5FF]/30 shadow-[0_-5px_15px_rgba(0,245,255,0.15)]' : 'border-transparent text-[#8b949e] hover:bg-[#00F5FF]/10 hover:text-[#00F5FF]'}`}
            onClick={() => onFileSelect(file.name)}
          >
            {isActive && (
              <motion.div 
                layoutId="activeTabTopBorder"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00F5FF] shadow-[0_0_10px_#00F5FF]"
              />
            )}
            <span className="flex items-center justify-center shrink-0">
              <fileIcon.icon size={14} style={{ color: isActive ? '#00F5FF' : fileIcon.color, filter: isActive ? 'drop-shadow(0 0 5px #00F5FF)' : 'none' }} />
            </span>
            <span>{file.name}</span>
            <span 
               className={`flex items-center justify-center rounded-full p-0.5 ml-1 transition-all ${isActive ? 'opacity-100 hover:bg-[#FF3E6C]/20 hover:text-[#FF3E6C] hover:drop-shadow-[0_0_5px_#FF3E6C]' : 'opacity-0 group-hover:opacity-100 hover:bg-[#FF3E6C]/20 hover:text-[#FF3E6C] hover:drop-shadow-[0_0_5px_#FF3E6C]'}`}
               onClick={(e) => {
                 e.stopPropagation();
                 onFileClose(file.name);
               }}
            >
               <X size={14} />
            </span>
          </motion.div>
        );
      })}
      </AnimatePresence>
      <div 
        className="flex items-center justify-center px-3 cursor-pointer text-[#8b949e] hover:text-white transition-colors"
        title="New File"
        onClick={() => {
          // If a prop was passed for new file, we could call it here. For now it triggers App's handler elsewhere or we can ignore since there's + in Explorer.
        }}
      >
        <Plus size={16} />
      </div>
    </div>
  );
}
