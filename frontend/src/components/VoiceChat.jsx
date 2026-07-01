import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Users } from 'lucide-react';

const VoiceChat = ({ roomId }) => {
    const [isMuted, setIsMuted] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [peers, setPeers] = useState([]);
    
    const wsRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const audioRefs = useRef({});

    useEffect(() => {
        // Initialize WebSocket for signaling
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/signaling/${roomId}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            ws.send(JSON.stringify({ type: 'join', peerId: generateId() }));
        };

        ws.onmessage = async (message) => {
            const data = JSON.parse(message.data);
            
            if (data.type === 'join') {
                // Another user joined, initiate connection
                createPeerConnection(data.peerId, true);
            } else if (data.type === 'offer') {
                await handleOffer(data);
            } else if (data.type === 'answer') {
                await handleAnswer(data);
            } else if (data.type === 'ice-candidate') {
                await handleIceCandidate(data);
            } else if (data.type === 'leave') {
                handlePeerLeave(data.peerId);
            }
        };

        ws.onclose = () => setIsConnected(false);

        return () => {
            if (wsRef.current) wsRef.current.close();
            stopLocalStream();
            Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        };
    }, [roomId]);

    const generateId = () => Math.random().toString(36).substr(2, 9);
    
    // WebRTC logic simplified for the sake of standard connections
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    const createPeerConnection = async (peerId, isInitiator) => {
        const pc = new RTCPeerConnection(configuration);
        peerConnectionsRef.current[peerId] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate && wsRef.current) {
                wsRef.current.send(JSON.stringify({ type: 'ice-candidate', peerId, candidate: event.candidate }));
            }
        };

        pc.ontrack = (event) => {
            if (!audioRefs.current[peerId]) {
                const audio = new Audio();
                audio.srcObject = event.streams[0];
                audio.autoplay = true;
                audioRefs.current[peerId] = audio;
                setPeers(prev => [...prev, peerId]);
            }
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
        }

        if (isInitiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            wsRef.current.send(JSON.stringify({ type: 'offer', peerId, offer }));
        }
        
        return pc;
    };

    const handleOffer = async (data) => {
        const pc = await createPeerConnection(data.peerId, false);
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        wsRef.current.send(JSON.stringify({ type: 'answer', peerId: data.peerId, answer }));
    };

    const handleAnswer = async (data) => {
        const pc = peerConnectionsRef.current[data.peerId];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    };

    const handleIceCandidate = async (data) => {
        const pc = peerConnectionsRef.current[data.peerId];
        if (pc && data.candidate) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    };

    const handlePeerLeave = (peerId) => {
        if (peerConnectionsRef.current[peerId]) {
            peerConnectionsRef.current[peerId].close();
            delete peerConnectionsRef.current[peerId];
        }
        if (audioRefs.current[peerId]) {
            audioRefs.current[peerId].pause();
            delete audioRefs.current[peerId];
        }
        setPeers(prev => prev.filter(p => p !== peerId));
    };

    const toggleMute = async () => {
        if (isMuted) {
            // Unmute -> start capturing
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;
                
                // Add tracks to existing connections
                Object.values(peerConnectionsRef.current).forEach(pc => {
                    stream.getTracks().forEach(track => pc.addTrack(track, stream));
                });
                
                setIsMuted(false);
            } catch (err) {
                console.error("Error accessing microphone", err);
            }
        } else {
            // Mute -> stop capturing
            stopLocalStream();
            setIsMuted(true);
        }
    };

    const stopLocalStream = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
    };

    return (
        <div className="flex items-center gap-4 text-sm bg-[#2d2d2d] px-3 py-1 rounded border border-gray-700">
            <div className="flex items-center gap-2" title={`${peers.length} other users connected`}>
                <Users size={16} className={peers.length > 0 ? "text-green-400" : "text-gray-400"} />
                <span>{peers.length + 1}</span>
            </div>
            
            <button 
                onClick={toggleMute}
                className={`p-1 rounded transition-colors ${isConnected ? 'hover:bg-gray-600' : 'opacity-50 cursor-not-allowed'}`}
                disabled={!isConnected}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
                {isMuted ? <MicOff size={18} className="text-red-400" /> : <Mic size={18} className="text-green-400" />}
            </button>
        </div>
    );
};

export default VoiceChat;
