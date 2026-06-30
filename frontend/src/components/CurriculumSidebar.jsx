import React, { useState } from 'react';
import { X, Code, ChevronDown, ChevronRight } from 'lucide-react';
import { CURRICULUM_DATA } from '../constants/curriculumData';

export default function CurriculumSidebar({ isOpen, onClose, onSelectExample }) {
  const [activeLang, setActiveLang] = useState('python');
  const [expandedSections, setExpandedSections] = useState({
    Beginner: true, Intermediate: true, Advanced: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isOpen) return null;

  return (
    <div className="ide-sidebar">
      <div className="sidebar-header">
        <span>Curriculum</span>
        <button onClick={onClose} style={{ color: '#858585', display: 'flex', alignItems: 'center', padding: 2, borderRadius: 3 }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#e0e0e0'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.background = 'none'; }}
        >
          <X size={16} />
        </button>
      </div>
      <div className="sidebar-tabs">
        {['python', 'c', 'cpp'].map(lang => (
          <button key={lang} onClick={() => setActiveLang(lang)}
            className={`sidebar-tab ${activeLang === lang ? 'active' : ''}`}>
            {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
          </button>
        ))}
      </div>
      <div className="sidebar-content">
        {['Beginner', 'Intermediate', 'Advanced'].map(level => (
          <div key={level} className="tree-section">
            <div className="tree-section-header" onClick={() => toggleSection(level)}>
              {expandedSections[level] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {level}
            </div>
            {expandedSections[level] && CURRICULUM_DATA[activeLang][level].map((example, idx) => (
              <div key={idx} className="tree-item" onClick={() => onSelectExample(activeLang, example.code)}>
                <Code size={16} className="tree-item-icon" />
                <div className="tree-item-content">
                  <div className="tree-item-title">{example.title}</div>
                  <div className="tree-item-desc">{example.description}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
