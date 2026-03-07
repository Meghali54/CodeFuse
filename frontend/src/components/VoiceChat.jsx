import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";

const VoiceChat = ({ roomId, socket, username, users }) => {
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [voiceUsers, setVoiceUsers] = useState([]); // Array of { socketId, username, stream, isSpeaking }

    const peersRef = useRef({}); // { socketId: RTCPeerConnection }
    const localStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const vadIntervalRef = useRef(null);

    const iceServers = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ],
    };

    const createPeerConnection = useCallback((targetId, stream) => {
        const pc = new RTCPeerConnection(iceServers);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("voice-signal", {
                    roomId,
                    targetId,
                    signal: { type: "ice-candidate", candidate: event.candidate },
                });
            }
        };

        pc.ontrack = (event) => {
            console.log(`Received track from ${targetId}`);
            setVoiceUsers((prev) => {
                const existing = prev.find((u) => u.socketId === targetId);
                if (existing) {
                    return prev.map((u) =>
                        u.socketId === targetId ? { ...u, stream: event.streams[0] } : u
                    );
                }
                const user = users.find((u) => u.socketId === targetId);
                return [...prev, {
                    socketId: targetId,
                    username: user?.username || "Unknown",
                    stream: event.streams[0],
                    isSpeaking: false
                }];
            });
        };

        if (stream) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        return pc;
    }, [roomId, socket, users]);

    const handleJoinVoice = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;
            setIsJoined(true);

            // Start VAD
            startVAD(stream);

            socket.emit("voice-join", { roomId, username });

            // In a mesh, the new user initiates offers to everyone already there.
            users.forEach((user) => {
                if (user.socketId !== socket.id) {
                    initiateOffer(user.socketId, stream);
                }
            });

            toast.success("Joined voice chat");
        } catch (err) {
            console.error("Failed to get microphone access:", err);
            toast.error("Microphone access denied");
        }
    };

    const initiateOffer = async (targetId, stream) => {
        let pc = peersRef.current[targetId];

        if (!pc) {
            pc = createPeerConnection(targetId, stream);
            peersRef.current[targetId] = pc;
        } else if (stream) {
            // If connection exists but no tracks are being sent, add them
            const senders = pc.getSenders();
            const hasAudioTrack = senders.some(s => s.track && s.track.kind === 'audio');
            if (!hasAudioTrack) {
                stream.getTracks().forEach(track => pc.addTrack(track, stream));
            }
        }

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("voice-signal", {
                roomId,
                targetId,
                signal: { type: "offer", sdp: pc.localDescription },
            });
        } catch (err) {
            console.error(`Failed to create offer for ${targetId}:`, err);
        }
    };

    const handleLeaveVoice = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        Object.values(peersRef.current).forEach((pc) => pc.close());
        peersRef.current = {};

        setLocalStream(null);
        localStreamRef.current = null;
        setIsJoined(false);
        setVoiceUsers([]);
        stopVAD();

        socket.emit("voice-leave", { roomId });
        toast.info("Left voice chat");
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const startVAD = (stream) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 512;

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let speaking = false;

        vadIntervalRef.current = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

            const isCurrentlySpeaking = average > 30; // Threshold
            if (isCurrentlySpeaking !== speaking) {
                speaking = isCurrentlySpeaking;
                socket.emit("voice-speaking-status", { roomId, isSpeaking: speaking });
            }
        }, 200);
    };

    const stopVAD = () => {
        if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
    };

    useEffect(() => {
        if (!socket) return;

        const handleSignal = async ({ senderId, signal }) => {
            let pc = peersRef.current[senderId];

            if (signal.type === "offer") {
                if (!pc) {
                    pc = createPeerConnection(senderId, localStreamRef.current);
                    peersRef.current[senderId] = pc;
                }
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("voice-signal", {
                    roomId,
                    targetId: senderId,
                    signal: { type: "answer", sdp: pc.localDescription },
                });
            } else if (signal.type === "answer") {
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                }
            } else if (signal.type === "ice-candidate") {
                if (pc) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    } catch (e) {
                        console.error("Error adding ice candidate", e);
                    }
                }
            }
        };

        const handleVoiceUserJoined = ({ socketId, username }) => {
            console.log(`User ${username} joined voice`);
            // If we are already in voice, initiate connection to the newcomer
            if (localStreamRef.current) {
                initiateOffer(socketId, localStreamRef.current);
            }
        };

        const handleVoiceUserLeft = ({ socketId }) => {
            if (peersRef.current[socketId]) {
                peersRef.current[socketId].close();
                delete peersRef.current[socketId];
            }
            setVoiceUsers((prev) => prev.filter((u) => u.socketId !== socketId));
        };

        const handleSpeakingStatus = ({ socketId, isSpeaking }) => {
            setVoiceUsers((prev) =>
                prev.map((u) => (u.socketId === socketId ? { ...u, isSpeaking } : u))
            );
        };

        socket.on("voice-signal", handleSignal);
        socket.on("voice-user-joined", handleVoiceUserJoined);
        socket.on("voice-user-left", handleVoiceUserLeft);
        socket.on("voice-speaking-status", handleSpeakingStatus);

        return () => {
            socket.off("voice-signal", handleSignal);
            socket.off("voice-user-joined", handleVoiceUserJoined);
            socket.off("voice-user-left", handleVoiceUserLeft);
            socket.off("voice-speaking-status", handleSpeakingStatus);
        };
    }, [socket, roomId, createPeerConnection]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            handleLeaveVoice();
        };
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-40 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 w-72 transition-all duration-300 transform">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isJoined ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`} />
                    <h3 className="text-white font-bold text-sm">Voice Channel</h3>
                </div>
                {!isJoined ? (
                    <button
                        onClick={handleJoinVoice}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                        Join
                    </button>
                ) : (
                    <button
                        onClick={handleLeaveVoice}
                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                    >
                        Leave
                    </button>
                )}
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto mb-4 scrollbar-hide">
                {isJoined && (
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className={`w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-sm ${!isMuted && isJoined && "ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-900"}`}>
                                    {username[0].toUpperCase()}
                                </div>
                                {isMuted && (
                                    <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 border border-zinc-900">
                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3zM5 8a1 1 0 00-1 1 6 6 0 0012 0 1 1 0 10-2 0 4 4 0 01-8 0 1 1 0 00-1-1zM10 16a1 1 0 100 2h4a1 1 0 100-2h-4z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <span className="text-zinc-300 text-sm font-medium">You</span>
                        </div>
                        <button
                            onClick={toggleMute}
                            className={`p-2 rounded-lg transition-colors ${isMuted ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                        >
                            {isMuted ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}

                {voiceUsers.map((user) => (
                    <div key={user.socketId} className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-sm ${user.isSpeaking && "ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-900 animate-pulse"}`}>
                                {user.username[0].toUpperCase()}
                            </div>
                            <audio
                                ref={(el) => {
                                    if (el && user.stream) {
                                        if (el.srcObject !== user.stream) {
                                            el.srcObject = user.stream;
                                            el.play().catch(e => console.log("Autoplay blocked or failed:", e));
                                        }
                                    }
                                }}
                                autoPlay
                                playsInline
                            />
                        </div>
                        <span className="text-zinc-400 text-sm font-medium">{user.username}</span>
                        {user.isSpeaking && (
                            <span className="text-[10px] text-green-500 font-bold animate-pulse">Speaking...</span>
                        )}
                    </div>
                ))}

                {isJoined && voiceUsers.length === 0 && (
                    <div className="py-4 text-center">
                        <p className="text-zinc-500 text-xs italic">Waiting for others to join...</p>
                    </div>
                )}
            </div>

            {!isJoined && (
                <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                    <p className="text-zinc-400 text-[11px] text-center leading-relaxed">
                        Join the voice channel to talk with your collaborators in real-time.
                    </p>
                </div>
            )}
        </div>
    );
};

export default VoiceChat;
