import React from 'react';
import { Sparkles, Bot } from 'lucide-react';

const TABS = [
  { id: 'visualizer', label: 'Visualizer', icon: Sparkles },
  { id: 'tutor', label: 'AI Tutor', icon: Bot },
];

export default function RightPanelTabs({ activeTab, onTabChange }) {
  return (
    <div className="panel-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <tab.icon size={14} className="panel-tab-icon" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
