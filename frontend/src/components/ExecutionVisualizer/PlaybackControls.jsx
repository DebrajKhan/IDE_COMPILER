import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

const SPEEDS = [0.5, 1, 2, 4];

export default function PlaybackControls({
  isPlaying, currentStep, totalSteps, speed,
  onPlay, onPause, onStepForward, onStepBack, onReset, onSpeedChange,
}) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-transparent border-b border-[#00F5FF]/20">

      {/* Playback Buttons */}
      <div className="flex items-center gap-2 bg-transparent sci-fi-glass border border-[#00F5FF]/20 shadow-[0_0_15px_rgba(0,245,255,0.1)] px-2 py-1 rounded-full">
        <button
          className="p-2 rounded-full hover:bg-[#00F5FF]/20 text-[#8b949e] hover:text-[#00F5FF] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Step Back"
          onClick={onStepBack}
          disabled={currentStep <= 0}
        >
          <SkipBack size={16} />
        </button>

        <button
          className={`p-2 rounded-full flex items-center justify-center transition-all shadow-sm ${isPlaying
            ? 'bg-[#FF3E6C]/20 text-[#FF3E6C] shadow-[0_0_15px_rgba(255,62,108,0.4)] hover:bg-[#FF3E6C]/40 hover:scale-110'
            : 'bg-[#00F5FF]/20 text-[#00F5FF] shadow-[0_0_15px_rgba(0,245,255,0.4)] hover:bg-[#00F5FF]/40 hover:scale-110'
            }`}
          title={isPlaying ? 'Pause' : 'Play'}
          onClick={isPlaying ? onPause : onPlay}
          disabled={totalSteps === 0}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>

        <button
          className="p-2 rounded-full hover:bg-[#00F5FF]/20 text-[#8b949e] hover:text-[#00F5FF] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Step Forward"
          onClick={onStepForward}
          disabled={currentStep >= totalSteps - 1}
        >
          <SkipForward size={16} />
        </button>

        <div className="w-px h-6 bg-[#00F5FF]/20 mx-1"></div>

        <button
          className="p-2 rounded-full hover:bg-[#00F5FF]/20 text-[#8b949e] hover:text-[#00F5FF] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Reset"
          onClick={onReset}
          disabled={totalSteps === 0}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-3 min-w-[200px] px-4">
        <div className="h-1.5 flex-1 bg-[#00F5FF]/10 rounded-full overflow-hidden relative shadow-[inset_0_0_5px_rgba(0,245,255,0.1)]">
          <div
            className="absolute top-0 left-0 h-full bg-[#00F5FF] shadow-[0_0_10px_#00F5FF] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-[#00F5FF] whitespace-nowrap min-w-[40px] text-right font-bold tracking-widest">
          {totalSteps > 0 ? `${currentStep + 1} / ${totalSteps}` : '0 / 0'}
        </span>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-1 bg-transparent sci-fi-glass border border-[#00F5FF]/20 shadow-[0_0_15px_rgba(0,245,255,0.1)] px-2 py-1 rounded-full">
        {SPEEDS.map(s => (
          <button
            key={s}
            className={`px-3 py-1 text-[10px] rounded-full font-mono font-bold tracking-wider transition-all ${speed === s
              ? 'bg-[#00F5FF]/20 text-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.2)]'
              : 'text-[#8b949e] hover:text-[#00F5FF] hover:bg-[#00F5FF]/10'
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