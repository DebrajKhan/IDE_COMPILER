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
    <div className="exec-viz flex flex-col h-full bg-[#1e1e2e] text-white rounded-lg overflow-hidden border border-gray-700 relative">
      {/* Header */}
      <div className="panel-tabs flex border-b border-gray-800 bg-[#181825] px-4 py-2 justify-between items-center">
        <div className="panel-tab active flex items-center gap-2 text-sm font-semibold text-blue-400">
          <Sparkles size={14} />
          EXECUTION VISUALIZER
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: '#4ade80', fontSize: 10 }}>●</span>
          <span style={{ color: '#4ade80', fontWeight: 600, letterSpacing: '0.5px' }}>LIVE</span>
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
        <div className="exec-line-indicator px-4 py-2 bg-[#11111b] border-y border-gray-800 flex items-center gap-3">
          <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-mono">
            L{activeLine}
          </span>
          <code className="text-sm text-gray-300 font-mono">
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
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 opacity-70">
            <div className="text-5xl">⚡</div>
            <div className="text-sm">Run your code to see the execution visualized step-by-step</div>
          </div>
        ) : (
          /* ACTIVE STATE: The New Animation Panels */
          <div className="flex flex-col h-full">
            {/* Top Section: RAM Memory (Arrays, Vectors, Strings, Objects) */}
            <div className="flex-1 bg-[#181825] border border-gray-700 rounded-md overflow-hidden min-h-[16rem]">
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
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
            >
              <div className="bg-[#1e1e2e] border border-red-500/50 rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full">
                <div className="bg-red-500/20 px-6 py-4 flex items-center gap-3 border-b border-red-500/30">
                  <AlertTriangle className="text-red-400" size={24} />
                  <h3 className="text-red-400 font-bold text-lg m-0">{execError.type || 'Runtime Error'}</h3>
                </div>
                <div className="p-6 text-gray-300">
                  <p className="mb-4">{execError.message}</p>
                  {execError.traceback && (
                    <pre className="bg-black/40 p-4 rounded text-xs font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap">
                      {execError.traceback.join('')}
                    </pre>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={onReset}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      Reset Execution
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