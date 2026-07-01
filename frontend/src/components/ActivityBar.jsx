import React, { useState } from 'react';
import { Files, Search, Package, Settings, User, ChevronRight, ChevronDown, FileCode, FileJson, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACTIVITIES = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'extensions', icon: Package, label: 'Extensions' },
];

const BOTTOM_ACTIVITIES = [
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'account', icon: User, label: 'Account' },
];

export default function ActivityBar({ activeItem, onItemClick, files, activeFileName, onFileSelect, onFileCreate, onFileRename, onFileDelete }) {
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [folderExpanded, setFolderExpanded] = useState(true);
  const [renamingFile, setRenamingFile] = useState(null);
  const [newName, setNewName] = useState('');
  const showExplorer = activeItem === 'explorer';

  const getFileIcon = (name) => {
    if (name.endsWith('.py')) return { icon: FileCode, color: '#3572a5' };
    if (name.endsWith('.json')) return { icon: FileJson, color: '#e8a427' };
    if (name.endsWith('.md')) return { icon: FileText, color: '#519aba' };
    if (name.endsWith('.c') || name.endsWith('.cpp')) return { icon: FileCode, color: '#f34b7d' };
    return { icon: FileText, color: '#858585' };
  };

  const handleRenameSubmit = (oldName) => {
    if (newName && newName.trim() !== '') {
      onFileRename(oldName, newName.trim());
    }
    setRenamingFile(null);
    setNewName('');
  };

  return (
    <div className="flex h-full border-r border-[#00F5FF]/10 bg-transparent">

      {/* Icon strip */}
      <div className="w-[50px] flex-shrink-0 flex flex-col items-center py-4 bg-transparent border-r border-[#00F5FF]/10">
        {ACTIVITIES.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.1, color: '#00F5FF' }}
              whileTap={{ scale: 0.9 }}
              className={`relative flex items-center justify-center w-full h-[50px] cursor-pointer mb-2 transition-all ${
                isActive ? 'text-[#00F5FF]' : 'text-[#8b949e]'
              }`}
              title={item.label}
              onClick={() => onItemClick(item.id)}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIconGlow"
                  className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00F5FF] shadow-[0_0_15px_#00F5FF]"
                />
              )}
              <item.icon size={24} strokeWidth={1.5} style={{ filter: isActive ? 'drop-shadow(0 0 8px #00F5FF)' : 'none' }} />
            </motion.div>
          );
        })}
        
        <div className="flex-1" />
        
        {BOTTOM_ACTIVITIES.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.1, color: '#00FFA3' }}
              whileTap={{ scale: 0.9 }}
              className={`relative flex items-center justify-center w-full h-[50px] cursor-pointer transition-all ${
                isActive ? 'text-[#00FFA3]' : 'text-[#8b949e]'
              }`}
              title={item.label}
              onClick={() => onItemClick(item.id)}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIconGlowBottom"
                  className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00FFA3] shadow-[0_0_15px_#00FFA3]"
                />
              )}
              <item.icon size={24} strokeWidth={1.5} style={{ filter: isActive ? 'drop-shadow(0 0 8px #00FFA3)' : 'none' }} />
            </motion.div>
          );
        })}
      </div>

      {/* Explorer sidebar */}
      {showExplorer && (
        <div className="w-[240px] flex-shrink-0 bg-transparent flex flex-col overflow-hidden sci-fi-glass border-none">
          <div className="px-4 py-4 flex items-center justify-between text-[10px] font-bold tracking-[2px] text-[#00F5FF] shrink-0 border-b border-[#00F5FF]/10 shadow-[0_0_15px_rgba(0,245,255,0.05)]">
            <span>NEURAL FILESYS</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div 
              className="flex items-center gap-2 px-4 py-2 mt-2 text-[11px] font-bold tracking-widest text-[#00F5FF] cursor-pointer hover:bg-[#00F5FF]/10 transition-colors"
              onClick={() => setFolderExpanded(!folderExpanded)}
            >
              <motion.div animate={{ rotate: folderExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight size={14} className="text-[#0099FF]" />
              </motion.div>
              <span className="flex-1 truncate uppercase" style={{ textShadow: '0 0 5px rgba(0,245,255,0.5)' }}>ALPHA-CORE</span>
            </div>
            <AnimatePresence>
              {folderExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-1">
                    {files && files.map((file) => {
                      const fileIcon = getFileIcon(file.name);
                      const isActive = file.name === activeFileName;
                      const isRenaming = renamingFile === file.name;

                      return (
                        <motion.div 
                          whileHover={{ x: 4, backgroundColor: 'rgba(0,245,255,0.1)' }}
                          key={file.name} 
                          className={`relative flex items-center gap-3 px-4 py-1.5 mx-2 my-1 rounded-md cursor-pointer group transition-all overflow-hidden ${isActive ? 'sci-fi-glass-card shadow-[0_0_15px_rgba(0,245,255,0.2)] text-white' : 'text-[#8b949e]'}`}
                          onClick={() => !isRenaming && onFileSelect(file.name)}
                        >
                          {isActive && (
                            <motion.div 
                              layoutId="activeFileGlow"
                              className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00F5FF] shadow-[0_0_10px_#00F5FF]"
                            />
                          )}
                      <fileIcon.icon size={16} style={{ color: isActive ? '#00F5FF' : fileIcon.color, flexShrink: 0, filter: isActive ? 'drop-shadow(0 0 5px #00F5FF)' : 'none' }} />
                      
                      {isRenaming ? (
                          <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={() => handleRenameSubmit(file.name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit(file.name);
                              if (e.key === 'Escape') setRenamingFile(null);
                            }}
                            className="bg-black/50 text-[#00F5FF] border border-[#00F5FF]/50 outline-none px-2 py-0.5 text-xs w-full rounded focus:shadow-[0_0_10px_rgba(0,245,255,0.3)]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <span className={`explorer-file-name flex-1 tracking-wide ${isActive ? 'text-white' : 'text-[#8b949e]'}`}>{file.name}</span>
                            <div className="hidden group-hover:flex gap-2 text-[#00F5FF]/50">
                              <span 
                                 className="hover:text-[#00F5FF] hover:drop-shadow-[0_0_5px_#00F5FF] cursor-pointer text-xs transition-all"
                                 title="Rename"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setRenamingFile(file.name);
                                   setNewName(file.name);
                                 }}
                              >
                                 ✎
                              </span>
                              <span 
                                 className="hover:text-[#FF3E6C] hover:drop-shadow-[0_0_5px_#FF3E6C] cursor-pointer text-xs transition-all"
                                 title="Delete"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   onFileDelete(file.name);
                                 }}
                              >
                                 ✕
                              </span>
                            </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
