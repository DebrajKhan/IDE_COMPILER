import React from 'react';
import { FileCode, X } from 'lucide-react';

const LANG_COLORS = { python: '#3572a5', c: '#555555', cpp: '#f34b7d' };

export default function EditorTabs({ language }) {
  const ext = language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'c';
  const filename = `main.${ext}`;
  const dotColor = LANG_COLORS[language] || '#cccccc';

  return (
    <div className="ide-tab-bar">
      <div className="ide-tab active">
        <span className="ide-tab-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileCode size={15} style={{ color: dotColor }} />
        </span>
        <span>{filename}</span>
        <span className="ide-tab-close"><X size={14} /></span>
      </div>
      <div className="ide-tab">
        <span className="ide-tab-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileCode size={15} style={{ color: '#3572a5' }} />
        </span>
        <span>utils.py</span>
        <span className="ide-tab-close"><X size={14} /></span>
      </div>
    </div>
  );
}
