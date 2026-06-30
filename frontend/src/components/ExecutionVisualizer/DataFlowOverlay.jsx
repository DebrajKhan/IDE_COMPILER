import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DataFlowOverlay({ dataFlowEvent, lastEventType }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dataFlowEvent) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500); // Slightly longer for readability
      return () => clearTimeout(timer);
    }
  }, [dataFlowEvent]);

  if (!dataFlowEvent || !visible) return null;

  const getFlowInfo = () => {
    switch (dataFlowEvent.type) {
      case 'assign':
        return { icon: '⚡', label: `→ ${dataFlowEvent.target}`, color: '#4ec9b0', bg: 'rgba(78,201,176,0.15)' };
      case 'call':
        return { icon: '📞', label: `call ${dataFlowEvent.target}()`, color: '#dcdcaa', bg: 'rgba(220,220,170,0.15)' };
      case 'return':
        return { icon: '↩️', label: `return from ${dataFlowEvent.source}`, color: '#c586c0', bg: 'rgba(197,134,192,0.15)' };
      case 'print':
        return { icon: '🖨️', label: `stdout`, color: '#ce9178', bg: 'rgba(206,145,120,0.15)' };
      default:
        return null;
    }
  };

  const info = getFlowInfo();
  if (!info) return null;

  return (
    // Fixed container so it floats over everything, pointer-events-none so it doesn't block clicks
    <div className="absolute top-20 right-8 z-50 pointer-events-none flex flex-col items-end">
      <AnimatePresence>
        <motion.div
          key={`${dataFlowEvent.type}-${Date.now()}`}
          className="relative flex items-center gap-3 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-md overflow-hidden"
          style={{ borderColor: info.color + '66', background: info.bg }}
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span className="text-lg">{info.icon}</span>
          <span className="font-mono font-bold text-sm tracking-wide" style={{ color: info.color }}>
            {info.label}
          </span>

          {/* Animated traveling dot effect inside the pill */}
          <motion.span
            className="absolute bottom-0 left-0 h-[2px] rounded-full"
            style={{ background: info.color, width: '20px' }}
            animate={{ x: [-20, 200], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}