import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useUser } from './UserContext';
import { useChat } from './ChatContext';
import { Socket } from 'socket.io-client';

export interface Participant {
  id: string;
  username: string;
  stream?: MediaStream;
  isSelf?: boolean;
}

interface VideoCallContextType {
  inCall: boolean;
  callIncoming: boolean;
  callParticipants: Participant[];
  localStream: MediaStream | null;
  isMuted: boolean;
  isCameraOn: boolean;
  audioOutputId: string | null;
  availableAudioOutputs: MediaDeviceInfo[];
  startCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
  setAudioOutput: (deviceId: string) => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN here for production
  ]
};

export const VideoCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inCall, setInCall] = useState(false);
  const [callIncoming, setCallIncoming] = useState(false);
  const [callParticipants, setCallParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [audioOutputId, setAudioOutputId] = useState<string | null>(null);
  const [availableAudioOutputs, setAvailableAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const { currentUser } = useUser();
  const { users, socket } = useChat() as { users: any; socket: Socket | null };
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});

  // Add a ringtone audio element
  const ringtone = typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3') : null;

  // --- WebRTC Mesh Logic ---
  // Helper: Get local media
  const getLocalStream = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera/microphone access. Please use a modern browser.');
      throw new Error('mediaDevices.getUserMedia not supported');
    }
    if (!localStream) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    }
    return localStream;
  };

  // Create peer connection for a user
  const createPeerConnection = (userId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && currentUser) {
        socket.emit('webrtc_ice_candidate', {
          to: userId,
          from: currentUser.id,
          candidate: event.candidate
        });
      }
    };
    pc.ontrack = (event) => {
      setCallParticipants(prev => prev.map(p =>
        p.id === userId ? { ...p, stream: event.streams[0] } : p
      ));
    };
    peerConnections.current[userId] = pc;
    return pc;
  };

  // Handle offer
  const handleOffer = async (data: any) => {
    if (!currentUser) return;
    let pc = peerConnections.current[data.from];
    if (!pc) pc = createPeerConnection(data.from);
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const stream = await getLocalStream();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    if (socket) {
      socket.emit('webrtc_answer', {
        to: data.from,
        from: currentUser.id,
        answer
      });
    }
  };

  // Handle answer
  const handleAnswer = async (data: any) => {
    const pc = peerConnections.current[data.from];
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = (data: any) => {
    const pc = peerConnections.current[data.from];
    if (pc && data.candidate) {
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };

  // --- Video Call Signaling Logic ---
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Handler: incoming call
    const handleIncomingCall = (data: any) => {
      if (data.from.userId !== currentUser.id) {
        setCallIncoming(true);
        // Play ringtone for incoming call
        if (ringtone) {
          ringtone.loop = true;
          ringtone.play().catch(() => {});
        }
      }
    };

    // Handler: call accepted
    const handleCallAccepted = async (data: any) => {
      setCallParticipants(prev => {
        if (prev.some(p => p.id === data.userId)) return prev;
        return [...prev, { id: data.userId, username: data.username }];
      });
      setInCall(true);
      // Initiate WebRTC connection if you are already in call
      if (inCall && currentUser.id !== data.userId) {
        // Initiator creates offer
        const pc = createPeerConnection(data.userId);
        const stream = await getLocalStream();
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socket) {
          socket.emit('webrtc_offer', {
            to: data.userId,
            from: currentUser.id,
            offer
          });
        }
      }
    };

    // Handler: call rejected
    const handleCallRejected = (data: any) => {
      setCallParticipants(prev => prev.filter(p => p.id !== data.userId));
      if (peerConnections.current[data.userId]) {
        peerConnections.current[data.userId].close();
        delete peerConnections.current[data.userId];
      }
    };

    // Handler: call ended
    const handleCallEnded = () => {
      setInCall(false);
      setCallParticipants([]);
      setLocalStream(null);
      setCallIncoming(false);
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      // Stop ringtone
      if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
      }
    };

    // WebRTC signaling
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, currentUser, inCall]);

  // Start a call
  const startCall = async () => {
    if (!socket || !currentUser) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera/microphone access. Please use a modern browser.');
      return;
    }
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
    } catch (err) {
      alert('Could not access camera/mic: ' + err);
      return;
    }
    setInCall(true);
    setCallParticipants([{ id: currentUser.id, username: currentUser.username, isSelf: true }]);
    socket.emit('start_call', { username: currentUser.username, userId: currentUser.id });
  };

  // Accept a call
  const acceptCall = async () => {
    if (!socket || !currentUser) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera/microphone access. Please use a modern browser.');
      return;
    }
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
    } catch (err) {
      alert('Could not access camera/mic: ' + err);
      return;
    }
    socket.emit('accept_call', { username: currentUser.username, userId: currentUser.id });
    setInCall(true);
    setCallIncoming(false);
    setCallParticipants(prev => {
      if (prev.some(p => p.id === currentUser.id)) return prev;
      return [...prev, { id: currentUser.id, username: currentUser.username, isSelf: true }];
    });
    // Stop ringtone
    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }
  };

  // Reject a call
  const rejectCall = () => {
    if (!socket || !currentUser) return;
    socket.emit('reject_call', { username: currentUser.username, userId: currentUser.id });
    setCallIncoming(false);
    // Stop ringtone
    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }
  };

  // End a call
  const endCall = () => {
    if (!socket || !currentUser) return;
    socket.emit('end_call', { username: currentUser.username, userId: currentUser.id });
    setInCall(false);
    setCallParticipants([]);
    setLocalStream(null);
    setCallIncoming(false);
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    // Stop ringtone
    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }
  };

  // Mute/unmute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  // Camera on/off
  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsCameraOn(track.enabled);
      });
    }
  };

  // Switch camera (if supported)
  const switchCamera = async () => {
    if (!localStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera/microphone access. Please use a modern browser.');
      return;
    }
    const videoTrack = localStream.getVideoTracks()[0];
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    if (videoDevices.length < 2) return;
    const currentDeviceId = videoTrack.getSettings().deviceId;
    const nextDevice = videoDevices.find(d => d.deviceId !== currentDeviceId) || videoDevices[0];
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextDevice.deviceId } },
      audio: true
    });
    // Replace video track in localStream
    const newVideoTrack = newStream.getVideoTracks()[0];
    localStream.removeTrack(videoTrack);
    localStream.addTrack(newVideoTrack);
    setLocalStream(newStream);
    // Replace video track in all peer connections
    Object.values(peerConnections.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(newVideoTrack);
    });
  };

  // Speaker selection
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setAvailableAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
      });
    } else {
      setAvailableAudioOutputs([]);
    }
  }, [inCall]);

  const setAudioOutput = (deviceId: string) => {
    setAudioOutputId(deviceId);
    // Set sinkId for all video elements (if supported)
    setTimeout(() => {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        // @ts-ignore
        if (video.sinkId !== undefined && video.setSinkId) {
          // @ts-ignore
          video.setSinkId(deviceId);
        }
      });
    }, 100);
  };

  return (
    <VideoCallContext.Provider value={{
      inCall,
      callIncoming,
      callParticipants,
      localStream,
      isMuted,
      isCameraOn,
      audioOutputId,
      availableAudioOutputs,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      setLocalStream,
      toggleMute,
      toggleCamera,
      switchCamera,
      setAudioOutput
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const ctx = useContext(VideoCallContext);
  if (!ctx) throw new Error('useVideoCall must be used within a VideoCallProvider');
  return ctx;
}; 