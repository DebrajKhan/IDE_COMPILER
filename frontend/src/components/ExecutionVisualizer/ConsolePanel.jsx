import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsolePanel({ consoleLines }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [consoleLines]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] text-green-400 font-mono p-4 border-l border-gray-800 relative">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800/50">
        <span className="text-xl text-gray-400">🖥️</span>
        <span className="font-bold text-sm tracking-wider text-gray-500">TERMINAL OUTPUT</span>
      </div>

      <div className="flex-1 overflow-y-auto text-sm space-y-1" ref={containerRef}>
        <AnimatePresence>
          {consoleLines.length === 0 && (
            <motion.div key="empty" className="text-gray-600 italic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Awaiting standard output...
            </motion.div>
          )}
          {consoleLines.map((line, i) => (
            <TypingLine key={`${line.step}-${i}`} text={line.text} delay={i * 25} />
          ))}
        </AnimatePresence>
        <motion.span
          className="inline-block w-2 h-4 bg-green-500 ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      </div>
    </div>
  );
}

function TypingLine({ text, delay }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');

    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        indexRef.current++;
        if (indexRef.current >= text.length) {
          setDisplayed(text);
          clearInterval(interval);
        } else {
          setDisplayed(text.slice(0, indexRef.current));
        }
      }, 15); // Sped up slightly for better UX
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, delay]);

  return (
    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex">
      <span className="text-gray-600 mr-2">❯</span>
      <span className="whitespace-pre-wrap break-all text-gray-300">{displayed}</span>
    </motion.div>
  );
}