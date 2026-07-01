import React from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PlaybackControls from './PlaybackControls';
import MemoryPanel from './MemoryPanel';
import DataFlowOverlay from './DataFlowOverlay';

/**
 * Main execution visualizer — orchestrates the beginner-friendly 
 * 2D animations for Memory, CallStack, DataFlow, and Console.
 */
export default function ExecutionVisualizer({
  execState,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onSpeedChange
}) {
  if (!execState) return null;

  const {
    variables, callStack, consoleLines, currentStep, totalSteps,
    isPlaying, speed, highlightVar, dataFlowEvent, lastEventType,
    activeLine, activeCode, execError,
  } = execState;

  // If we have totalSteps > 0, the execution has started
  const hasEvents = totalSteps > 0;

  return (
    <div className="exec-viz flex flex-col h-full bg-transparent text-white rounded-lg overflow-hidden border border-[#00F5FF]/20 relative mx-2 mb-2 sci-fi-glass shadow-[0_0_20px_rgba(0,245,255,0.05)]">
      {/* Header */}
      <div className="panel-tabs flex border-b border-[#00F5FF]/20 bg-transparent px-4 py-3 justify-between items-center shadow-[0_0_15px_rgba(0,245,255,0.05)]">
        <div className="panel-tab active flex items-center gap-2 text-[11px] font-bold text-[#00F5FF] tracking-[2px]">
          <Sparkles size={14} className="text-[#00F5FF]" style={{ filter: 'drop-shadow(0 0 5px #00F5FF)' }} />
          EXECUTION MATRIX
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <motion.span 
            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ color: '#00FFA3', fontSize: 10, filter: 'drop-shadow(0 0 5px #00FFA3)' }}
          >●</motion.span>
          <span style={{ color: '#00FFA3', fontWeight: 700, letterSpacing: '1px', textShadow: '0 0 5px rgba(0,255,163,0.5)' }}>LIVE NEURAL LINK</span>
        </div>
      </div>

      {/* Playback controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        currentStep={currentStep}
        totalSteps={totalSteps}
        speed={speed}
        onPlay={onPlay}
        onPause={onPause}
        onStepForward={onStepForward}
        onStepBack={onStepBack}
        onReset={onReset}
        onSpeedChange={onSpeedChange}
      />

      {/* Current line indicator */}
      {hasEvents && activeLine !== null && (
        <div className="exec-line-indicator px-4 py-2 bg-[rgba(0,245,255,0.05)] border-y border-[#00F5FF]/20 flex items-center gap-3">
          <span className="bg-[#00F5FF]/20 text-[#00F5FF] px-2 py-0.5 rounded text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,245,255,0.2)]">
            L{activeLine}
          </span>
          <code className="text-sm text-[#00F5FF] font-mono" style={{ textShadow: '0 0 5px rgba(0,245,255,0.5)' }}>
            {activeCode}
          </code>
        </div>
      )}

      {/* Data flow overlay (For sweeping arrows later) */}
      <DataFlowOverlay dataFlowEvent={dataFlowEvent} lastEventType={lastEventType} />

      {/* Scrollable visualization body */}
      <div className="exec-viz-body flex-1 overflow-y-auto p-4 relative">
        {!hasEvents ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center h-full text-[#8b949e] space-y-4 relative overflow-hidden w-full">
            {/* Particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-[#00F5FF] rounded-full opacity-0"
                style={{
                  width: Math.random() * 6 + 2,
                  height: Math.random() * 6 + 2,
                  left: `${Math.random() * 100}%`,
                  bottom: `-10%`,
                  boxShadow: '0 0 10px #00F5FF'
                }}
                animate={{
                  y: [0, -200],
                  x: [0, (Math.random() - 0.5) * 50],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 4,
                }}
              />
            ))}
            
            {/* The main bolt */}
            <motion.div 
              animate={{ 
                y: [0, -15, 0],
                filter: ['drop-shadow(0 0 10px rgba(0,245,255,0.4))', 'drop-shadow(0 0 40px rgba(0,245,255,0.8))', 'drop-shadow(0 0 10px rgba(0,245,255,0.4))']
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl mb-4 text-[#00F5FF] z-10"
            >⚡</motion.div>
            <div className="text-[13px] z-10 font-bold tracking-[2px] text-[#00F5FF]/80 uppercase">Awaiting Neural Sequence</div>
          </div>
        ) : (
          /* ACTIVE STATE: The New Animation Panels */
            <div className="flex flex-col h-full">
            {/* Top Section: RAM Memory (Arrays, Vectors, Strings, Objects) */}
            <div className="flex-1 bg-transparent border border-[#00F5FF]/20 rounded-lg overflow-hidden min-h-[16rem] sci-fi-glass shadow-[inset_0_0_20px_rgba(0,245,255,0.05)] relative">
              <MemoryPanel variables={variables} highlightVar={highlightVar} />
            </div>
          </div>
        )}

        {/* Error Overlay */}
        <AnimatePresence>
          {execError && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-8"
            >
              <div className="bg-[#0A0F1D] border border-[#FF3E6C] rounded-xl shadow-[0_0_50px_rgba(255,62,108,0.3)] overflow-hidden max-w-2xl w-full">
                <div className="bg-[#FF3E6C]/20 px-6 py-4 flex items-center gap-3 border-b border-[#FF3E6C]/30">
                  <AlertTriangle className="text-[#FF3E6C]" size={24} style={{ filter: 'drop-shadow(0 0 5px #FF3E6C)' }} />
                  <h3 className="text-[#FF3E6C] font-bold text-lg m-0 uppercase tracking-widest">{execError.type || 'System Failure'}</h3>
                </div>
                <div className="p-6 text-[#8b949e]">
                  <p className="mb-4 text-white">{execError.message}</p>
                  {execError.traceback && (
                    <pre className="bg-black/60 border border-[#FF3E6C]/20 p-4 rounded-lg text-xs font-mono text-[#FF3E6C] overflow-x-auto whitespace-pre-wrap shadow-[inset_0_0_10px_rgba(255,62,108,0.1)]">
                      {execError.traceback.join('')}
                    </pre>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={onReset}
                      className="bg-[#FF3E6C]/20 hover:bg-[#FF3E6C]/40 border border-[#FF3E6C] text-[#FF3E6C] px-6 py-2 rounded-full font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,62,108,0.2)] hover:shadow-[0_0_25px_rgba(255,62,108,0.4)] hover:scale-105"
                    >
                      Reboot Matrix
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}