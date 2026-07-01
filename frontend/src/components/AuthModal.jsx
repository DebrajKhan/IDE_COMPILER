import React, { useState } from 'react';
import { X, User, Lock, Mail, Cpu, Terminal } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Sci-Fi Backdrop with Grid and Glows */}
      <div className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Modal Container */}
      <div className="relative w-[450px] bg-[#111116]/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.15)] overflow-hidden flex flex-col transform transition-all">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />
        <div className="absolute top-0 right-4 w-[2px] h-12 bg-gradient-to-b from-cyan-500 to-transparent" />
        <div className="absolute top-0 left-4 w-[2px] h-12 bg-gradient-to-b from-cyan-500 to-transparent" />

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-cyan-500 hover:text-cyan-300 transition-colors z-10 p-1 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(0,240,255,0.5)]"
        >
          <X size={18} />
        </button>

        {/* Header Logo */}
        <div className="flex flex-col items-center pt-10 pb-6 px-8 relative z-10">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-50 rounded-full animate-pulse" />
            <div className="relative bg-[#0a0a0f] p-4 rounded-xl border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Cpu size={32} className="text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wider uppercase">
            SYS_AUTH
          </h2>
          <p className="text-cyan-700 text-xs font-mono mt-1 uppercase tracking-[0.2em]">Secure Node Link</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyan-900/50 relative z-10">
          <button 
            className={`flex-1 py-3 text-sm font-mono tracking-widest uppercase transition-all duration-300 ${tab === 'signin' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5 shadow-[inset_0_-10px_20px_rgba(0,240,255,0.05)]' : 'text-gray-500 hover:text-cyan-700'}`}
            onClick={() => setTab('signin')}
          >
            Authenticate
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-mono tracking-widest uppercase transition-all duration-300 ${tab === 'signup' ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5 shadow-[inset_0_-10px_20px_rgba(168,85,247,0.05)]' : 'text-gray-500 hover:text-purple-700'}`}
            onClick={() => setTab('signup')}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 relative z-10">
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className={`transition-colors ${tab === 'signup' ? 'text-purple-500' : 'text-cyan-500'}`} />
              </div>
              <input 
                type="text" 
                placeholder="USERNAME"
                className={`w-full bg-[#0a0a0f]/80 border ${tab === 'signup' ? 'border-purple-500/30 focus:border-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)]'} rounded-lg pl-10 pr-4 py-3 text-sm text-cyan-50 font-mono outline-none transition-all placeholder-cyan-900/50`}
              />
              {/* Sci-fi corner brackets */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {tab === 'signup' && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-purple-500" />
                </div>
                <input 
                  type="email" 
                  placeholder="EMAIL_ADDRESS"
                  className="w-full bg-[#0a0a0f]/80 border border-purple-500/30 rounded-lg pl-10 pr-4 py-3 text-sm text-purple-50 font-mono outline-none focus:border-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all placeholder-purple-900/50"
                />
              </div>
            )}

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className={`transition-colors ${tab === 'signup' ? 'text-purple-500' : 'text-cyan-500'}`} />
              </div>
              <input 
                type="password" 
                placeholder="SECRET_KEY"
                className={`w-full bg-[#0a0a0f]/80 border ${tab === 'signup' ? 'border-purple-500/30 focus:border-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)]'} rounded-lg pl-10 pr-4 py-3 text-sm text-cyan-50 font-mono outline-none transition-all placeholder-cyan-900/50`}
              />
            </div>

            <button 
              className={`mt-4 w-full py-3 rounded-lg font-mono font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-2 overflow-hidden relative group
                ${tab === 'signup' ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(0,240,255,0.4)]'}
              `}
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" style={{ transform: 'skewX(-20deg)' }} />
              <Terminal size={16} />
              {tab === 'signin' ? 'Initialize' : 'Create Node'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-cyan-900" />
            <span className="text-[10px] font-mono text-cyan-700 uppercase tracking-widest">External Link</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-cyan-900" />
          </div>

          <div className="mt-6 flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a1a24] border border-cyan-900/30 rounded-lg text-sm font-mono text-cyan-400 hover:text-white hover:bg-[#252533] hover:border-cyan-500/50 transition-all">
              GOOGLE
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a1a24] border border-cyan-900/30 rounded-lg text-sm font-mono text-purple-400 hover:text-white hover:bg-[#252533] hover:border-cyan-500/50 transition-all">
              GITHUB
            </button>
          </div>

        </div>
        
        {/* Glitch lines at bottom */}
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-cyan-500/20" />
          <div className="flex-1 bg-purple-500/20" />
          <div className="flex-1 bg-cyan-500/20" />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(200%) skewX(-20deg); }
        }
      `}} />
    </div>
  );
}
