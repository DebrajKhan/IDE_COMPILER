import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

const SPEEDS = [0.5, 1, 2, 4];

export default function PlaybackControls({
  isPlaying, currentStep, totalSteps, speed,
  onPlay, onPause, onStepForward, onStepBack, onReset, onSpeedChange,
}) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-[#181825] border-b border-gray-800">

      {/* Playback Buttons */}
      <div className="flex items-center gap-1 bg-[#11111b] p-1 rounded-lg border border-gray-800 shadow-inner">
        <button
          className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Step Back"
          onClick={onStepBack}
          disabled={currentStep <= 0}
        >
          <SkipBack size={16} />
        </button>

        <button
          className={`p-2 rounded flex items-center justify-center transition-colors shadow-sm ${isPlaying
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            }`}
          title={isPlaying ? 'Pause' : 'Play'}
          onClick={isPlaying ? onPause : onPlay}
          disabled={totalSteps === 0}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>

        <button
          className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Step Forward"
          onClick={onStepForward}
          disabled={currentStep >= totalSteps - 1}
        >
          <SkipForward size={16} />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1"></div>

        <button
          className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Reset"
          onClick={onReset}
          disabled={totalSteps === 0}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-3 min-w-[200px] px-4">
        <div className="h-2 flex-1 bg-[#11111b] rounded-full overflow-hidden border border-gray-800 relative">
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-mono text-gray-400 whitespace-nowrap min-w-[40px] text-right">
          {totalSteps > 0 ? `${currentStep + 1} / ${totalSteps}` : '0 / 0'}
        </span>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-1 bg-[#11111b] p-1 rounded-lg border border-gray-800">
        {SPEEDS.map(s => (
          <button
            key={s}
            className={`px-2 py-1 text-xs rounded font-mono transition-colors ${speed === s
              ? 'bg-blue-500/20 text-blue-400 font-bold'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
              }`}
            onClick={() => onSpeedChange(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}