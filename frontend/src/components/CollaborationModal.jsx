import React, { useState } from 'react';
import { X, Users, Link as LinkIcon, Key, Copy, Check } from 'lucide-react';

export default function CollaborationModal({ isOpen, onClose, onCreateSession, onJoinSession, error, initialSessionId }) {
  const [tab, setTab] = useState(initialSessionId ? 'join' : 'create'); // 'create' | 'join'
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [username, setUsername] = useState('Guest' + Math.floor(Math.random() * 1000));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdSession, setCreatedSession] = useState(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/session/create', { method: 'POST' });
      const data = await res.json();
      setCreatedSession(data.session_id);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!sessionId) return;
    setLoading(true);
    await onJoinSession(sessionId, username);
    setLoading(false);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/?session=${createdSession}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enterSession = () => {
    onJoinSession(createdSession, username);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl w-[450px] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#252526]">
          <div className="flex items-center gap-2 text-white font-medium">
            <Users size={18} className="text-blue-400" />
            <span>Multiplayer Collaboration</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!createdSession ? (
            <>
              <div className="flex bg-[#2d2d2d] rounded-lg p-1">
                <button 
                  className={`flex-1 py-2 text-sm rounded-md transition-colors ${tab === 'create' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setTab('create')}
                >
                  Create Session
                </button>
                <button 
                  className={`flex-1 py-2 text-sm rounded-md transition-colors ${tab === 'join' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setTab('join')}
                >
                  Join Session
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Your Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#3c3c3c] border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors w-full"
                  placeholder="e.g. CodeNinja"
                />
              </div>

              {tab === 'join' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Session ID</label>
                  <input 
                    type="text" 
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                    className="bg-[#3c3c3c] border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors font-mono tracking-widest uppercase w-full"
                    placeholder="e.g. X7B9A2"
                  />
                </div>
              )}

              <button 
                onClick={tab === 'create' ? handleCreate : handleJoin}
                disabled={loading || (tab === 'join' && !sessionId)}
                className="bg-[#007acc] hover:bg-[#006bb3] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
              >
                {loading ? 'Processing...' : tab === 'create' ? 'Generate Room Link' : 'Join Session'}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-5 text-center">
              <div className="flex justify-center">
                <div className="bg-green-500/20 text-green-400 p-4 rounded-full">
                  <Check size={32} />
                </div>
              </div>
              <div>
                <h3 className="text-white font-medium text-lg mb-1">Session Created!</h3>
                <p className="text-gray-400 text-sm">Share this link with your teammates to code together.</p>
              </div>
              
              <div className="flex flex-col gap-2 bg-[#2d2d2d] p-3 rounded-lg border border-gray-600">
                <div className="text-xs text-gray-400 text-left font-mono">Session ID: <span className="text-white font-bold tracking-widest">{createdSession}</span></div>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={`${window.location.origin}/?session=${createdSession}`} 
                    className="flex-1 bg-[#1e1e1e] border border-gray-700 rounded p-2 text-gray-300 text-xs font-mono outline-none"
                  />
                  <button onClick={copyLink} className="bg-[#3c3c3c] hover:bg-[#4d4d4d] text-white p-2 rounded transition-colors flex items-center justify-center">
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <button 
                onClick={enterSession}
                className="bg-green-600 hover:bg-green-500 text-white font-medium py-3 rounded-lg transition-colors mt-2"
              >
                Enter Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
