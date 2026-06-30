import React, { useState } from 'react';
import { Files, Search, Package, Settings, User, ChevronRight, ChevronDown, FileCode, FileJson, FileText } from 'lucide-react';

const ACTIVITIES = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'extensions', icon: Package, label: 'Extensions' },
];

const BOTTOM_ACTIVITIES = [
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'account', icon: User, label: 'Account' },
];

// Mock file tree
const FILE_TREE = [
  { name: 'main.py', icon: FileCode, color: '#3572a5' },
  { name: 'utils.py', icon: FileCode, color: '#3572a5' },
  { name: 'config.json', icon: FileJson, color: '#e8a427' },
  { name: 'README.md', icon: FileText, color: '#519aba' },
];

export default function ActivityBar({ activeItem, onItemClick }) {
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [folderExpanded, setFolderExpanded] = useState(true);
  const showExplorer = activeItem === 'explorer';

  return (
    <div className="flex h-full">
      {/* Icon strip */}
      <div className="ide-activity-bar">
        {ACTIVITIES.map((item) => (
          <div
            key={item.id}
            className={`activity-icon ${activeItem === item.id ? 'active' : ''}`}
            title={item.label}
            onClick={() => onItemClick(item.id)}
          >
            <item.icon size={24} strokeWidth={1.5} />
          </div>
        ))}
        <div className="activity-spacer" />
        {BOTTOM_ACTIVITIES.map((item) => (
          <div
            key={item.id}
            className={`activity-icon ${activeItem === item.id ? 'active' : ''}`}
            title={item.label}
            onClick={() => onItemClick(item.id)}
          >
            <item.icon size={24} strokeWidth={1.5} />
          </div>
        ))}
      </div>

      {/* Explorer sidebar */}
      {showExplorer && (
        <div className="explorer-sidebar">
          <div className="explorer-header">
            <span>EXPLORER</span>
            <span style={{ fontSize: 16, cursor: 'pointer', color: '#858585' }}>···</span>
          </div>
          <div className="explorer-content">
            <div
              className="explorer-folder-header"
              onClick={() => setFolderExpanded(!folderExpanded)}
            >
              {folderExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="explorer-folder-name">ALPHA-CORE</span>
            </div>
            {folderExpanded && (
              <div className="explorer-file-list">
                {FILE_TREE.map((file) => (
                  <div key={file.name} className="explorer-file-item">
                    <file.icon size={16} style={{ color: file.color, flexShrink: 0 }} />
                    <span className="explorer-file-name">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
