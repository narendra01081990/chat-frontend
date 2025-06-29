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
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
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
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const incomingCallData = useRef<any>(null);
  const callInitiator = useRef<string | null>(null);

  // Initialize ringtone
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      ringtoneRef.current.loop = true;
    }
  }, []);

  // Helper: Get local media
  const getLocalStream = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera/microphone access. Please use a modern browser.');
      throw new Error('mediaDevices.getUserMedia not supported');
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  // Create peer connection for a user
  const createPeerConnection = (userId: string) => {
    console.log('Creating peer connection for user:', userId);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && currentUser) {
        console.log('Sending ICE candidate to:', userId);
        socket.emit('webrtc_ice_candidate', {
          to: userId,
          from: currentUser.id,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote stream for user:', userId, event.streams[0]);
      setCallParticipants(prev => {
        const existing = prev.find(p => p.id === userId);
        if (existing && existing.stream === event.streams[0]) {
          return prev; // Stream already set
        }
        return prev.map(p => 
          p.id === userId ? { ...p, stream: event.streams[0] } : p
        );
      });
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${userId}:`, pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}:`, pc.connectionState);
    };

    peerConnections.current[userId] = pc;
    return pc;
  };

  // Handle offer
  const handleOffer = async (data: any) => {
    if (!currentUser) return;
    
    console.log('Handling offer from:', data.from);
    
    let pc = peerConnections.current[data.from];
    if (!pc) {
      pc = createPeerConnection(data.from);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      console.log('Set remote description for offer from:', data.from);
      
      // Get local stream if not already available
      let stream = localStream;
      if (!stream) {
        console.log('Getting local stream for offer response');
        stream = await getLocalStream();
      }
      
      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind);
        pc.addTrack(track, stream!);
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('Created and set local answer for:', data.from);
      
      if (socket) {
        socket.emit('webrtc_answer', {
          to: data.from,
          from: currentUser.id,
          answer
        });
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  // Handle answer
  const handleAnswer = async (data: any) => {
    const pc = peerConnections.current[data.from];
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('Set remote description for answer from:', data.from);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = (data: any) => {
    const pc = peerConnections.current[data.from];
    if (pc && data.candidate) {
      try {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('Added ICE candidate from:', data.from);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  // Stop ringtone
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  // Start ringtone
  const startRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.play().catch(console.error);
    }
  };

  // --- Video Call Signaling Logic ---
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Handler: incoming call
    const handleIncomingCall = (data: any) => {
      console.log('Incoming call from:', data.from);
      if (data.from.userId !== currentUser.id) {
        incomingCallData.current = data.from;
        setCallIncoming(true);
        startRingtone();
      }
    };

    // Handler: call accepted
    const handleCallAccepted = async (data: any) => {
      console.log('Call accepted by:', data.username, 'User ID:', data.userId);
      
      // Stop ringtone if this user accepted the call
      if (data.userId === currentUser.id) {
        stopRingtone();
      }

      setCallParticipants(prev => {
        if (prev.some(p => p.id === data.userId)) return prev;
        return [...prev, { id: data.userId, username: data.username }];
      });

      // If we're the call initiator and someone accepted, create peer connection
      if (callInitiator.current === currentUser.id && currentUser.id !== data.userId) {
        console.log('Creating peer connection as initiator for:', data.userId);
        try {
          const pc = createPeerConnection(data.userId);
          const stream = localStream || await getLocalStream();
          
          // Add tracks to peer connection
          stream.getTracks().forEach(track => {
            console.log('Adding track to peer connection as initiator:', track.kind);
            pc.addTrack(track, stream);
          });
          
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log('Created offer as initiator for:', data.userId);
          
          if (socket) {
            socket.emit('webrtc_offer', {
              to: data.userId,
              from: currentUser.id,
              offer
            });
          }
        } catch (error) {
          console.error('Error creating offer for accepted call:', error);
        }
      }
    };

    // Handler: call rejected
    const handleCallRejected = (data: any) => {
      console.log('Call rejected by:', data.username);
      setCallParticipants(prev => prev.filter(p => p.id !== data.userId));
      
      if (peerConnections.current[data.userId]) {
        peerConnections.current[data.userId].close();
        delete peerConnections.current[data.userId];
      }
    };

    // Handler: call ended
    const handleCallEnded = (data: any) => {
      console.log('Call ended by:', data.username);
      stopRingtone();
      setInCall(false);
      setCallParticipants([]);
      setLocalStream(null);
      setCallIncoming(false);
      callInitiator.current = null;
      
      // Close all peer connections
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
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
  }, [socket, currentUser, inCall, localStream]);

  // Start a call
  const startCall = async () => {
    if (!socket || !currentUser) return;
    
    try {
      const stream = await getLocalStream();
      setInCall(true);
      callInitiator.current = currentUser.id;
      setCallParticipants([{ id: currentUser.id, username: currentUser.username, isSelf: true }]);
      socket.emit('start_call', { username: currentUser.username, userId: currentUser.id });
      console.log('Started call as initiator');
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  // Accept a call
  const acceptCall = async () => {
    if (!socket || !currentUser) return;
    
    try {
      const stream = await getLocalStream();
      socket.emit('accept_call', { username: currentUser.username, userId: currentUser.id });
      setInCall(true);
      setCallIncoming(false);
      setCallParticipants(prev => {
        if (prev.some(p => p.id === currentUser.id)) return prev;
        return [...prev, { id: currentUser.id, username: currentUser.username, isSelf: true }];
      });
      stopRingtone();
      console.log('Accepted call');
    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  // Reject a call
  const rejectCall = () => {
    if (!socket || !currentUser) return;
    socket.emit('reject_call', { username: currentUser.username, userId: currentUser.id });
    setCallIncoming(false);
    stopRingtone();
  };

  // End a call
  const endCall = () => {
    if (!socket || !currentUser) return;
    socket.emit('end_call', { username: currentUser.username, userId: currentUser.id });
    setInCall(false);
    setCallParticipants([]);
    setLocalStream(null);
    setCallIncoming(false);
    callInitiator.current = null;
    stopRingtone();
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
  };

  // Mute/unmute
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!audioTracks[0]?.enabled);
    }
  };

  // Camera on/off
  const toggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(!videoTracks[0]?.enabled);
    }
  };

  // Switch camera (if supported)
  const switchCamera = async () => {
    if (!localStream) return;
    
    try {
      const videoTrack = localStream.getVideoTracks()[0];
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      if (videoDevices.length < 2) {
        alert('No additional cameras found');
        return;
      }
      
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
      
      // Replace video track in all peer connections
      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      });
      
      // Stop the new stream (we only needed the track)
      newStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error switching camera:', error);
      alert('Could not switch camera');
    }
  };

  // Speaker selection
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setAvailableAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
      });
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