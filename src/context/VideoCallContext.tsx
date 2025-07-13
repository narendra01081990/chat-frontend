import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useUser } from './UserContext';
import { useChat } from './ChatContext';
import { Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

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
  isCallActive: boolean;
  startCall: () => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  joinCall: () => Promise<void>;
  setLocalStream: (stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
  setAudioOutput: (deviceId: string) => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

// ICE Servers configuration
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
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
  const [isCallActive, setIsCallActive] = useState(false);
  
  const { currentUser } = useUser();
  const { socket } = useChat() as { socket: Socket | null };
  
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const incomingCallData = useRef<any>(null);
  const callInitiator = useRef<string | null>(null);
  const activeCallUsers = useRef<Set<string>>(new Set());

  // Initialize ringtone
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      ringtoneRef.current.loop = true;
    }
  }, []);

  // Get local media stream
  const getLocalStream = async (): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support camera/microphone access');
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        }
      });

      console.log('Local stream obtained:', stream.getTracks().map(t => t.kind));
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  // Create a new peer connection
  const createPeerConnection = (userId: string): RTCPeerConnection => {
    console.log('Creating peer connection for:', userId);
    
    // Close existing connection if any
    if (peerConnections.current && peerConnections.current[userId]) {
      peerConnections.current[userId].close();
    }
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    // Handle ICE candidates
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

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote stream for:', userId, event.streams[0]);
      if (event.streams && event.streams[0]) {
        setCallParticipants(prev => {
          const existing = prev.find(p => p.id === userId);
          if (existing && existing.stream === event.streams[0]) {
            return prev;
          }
          return prev.map(p => 
            p.id === userId ? { ...p, stream: event.streams[0] } : p
          );
        });
      }
    };

    // Monitor connection states
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${userId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log(`Successfully connected to ${userId}`);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}:`, pc.connectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log(`Signaling state for ${userId}:`, pc.signalingState);
    };

    if (!peerConnections.current) {
      peerConnections.current = {};
    }
    peerConnections.current[userId] = pc;
    return pc;
  };

  // Handle WebRTC offer
  const handleOffer = async (data: any) => {
    if (!currentUser) return;
    
    console.log('Handling offer from:', data.from);
    
    let pc = peerConnections.current?.[data.from];
    if (!pc) {
      pc = createPeerConnection(data.from);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      console.log('Set remote description for offer from:', data.from);
      
      // Get local stream
      let stream = localStream;
      if (!stream) {
        stream = await getLocalStream();
        setLocalStream(stream);
      }
      
      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind);
        pc.addTrack(track, stream!);
      });

      // Create and send answer
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

  // Handle WebRTC answer
  const handleAnswer = async (data: any) => {
    const pc = peerConnections.current?.[data.from];
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
    const pc = peerConnections.current?.[data.from];
    if (pc && data.candidate) {
      try {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('Added ICE candidate from:', data.from);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  // Ringtone controls
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const startRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.play().catch(console.error);
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleIncomingCall = (data: any) => {
      console.log('Incoming call from:', data.from);
      if (data.from.userId !== currentUser.id) {
        incomingCallData.current = data.from;
        callInitiator.current = data.from.userId;
        setCallIncoming(true);
        startRingtone();
      }
    };

    const handleCallAccepted = async (data: any) => {
      console.log('Call accepted by:', data.username, 'User ID:', data.userId);
      
      activeCallUsers.current.add(data.userId);
      setIsCallActive(true);
      
      if (data.userId !== currentUser.id) {
        toast.success(`${data.username} accepted the video call`);
      }
      
      if (data.userId === currentUser.id) {
        stopRingtone();
      }

      setCallParticipants(prev => {
        if (prev.some(p => p.id === data.userId)) return prev;
        return [...prev, { id: data.userId, username: data.username }];
      });

      // If we're the initiator and someone accepted, create peer connection
      if (callInitiator.current === currentUser.id && currentUser.id !== data.userId) {
        console.log('Creating peer connection as initiator for:', data.userId);
        try {
          const pc = createPeerConnection(data.userId);
          const stream = localStream || await getLocalStream();
          
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
          
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
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
      
      // If we're the acceptor, create peer connection with initiator
      if (data.userId === currentUser.id && callInitiator.current && callInitiator.current !== currentUser.id) {
        console.log('Creating peer connection as acceptor with initiator:', callInitiator.current);
        try {
          const pc = createPeerConnection(callInitiator.current);
          const stream = localStream || await getLocalStream();
          
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
          
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          if (socket) {
            socket.emit('webrtc_offer', {
              to: callInitiator.current,
              from: currentUser.id,
              offer
            });
          }
        } catch (error) {
          console.error('Error creating peer connection with initiator:', error);
        }
      }
    };

    const handleCallRejected = (data: any) => {
      console.log('Call rejected by:', data.username);
      setCallParticipants(prev => prev.filter(p => p.id !== data.userId));
      activeCallUsers.current.delete(data.userId);
      
      if (peerConnections.current?.[data.userId]) {
        peerConnections.current[data.userId].close();
        delete peerConnections.current[data.userId];
      }
    };

    const handleCallEnded = (data: any) => {
      console.log('Call ended by:', data.username);
      stopRingtone();
      setInCall(false);
      setCallParticipants([]);
      setLocalStream(null);
      setCallIncoming(false);
      setIsCallActive(false);
      callInitiator.current = null;
      activeCallUsers.current.clear();
      
      if (peerConnections.current) {
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
      }
    };

    const handleUserJoinedCall = (data: any) => {
      console.log('User joined existing call:', data.username);
      activeCallUsers.current.add(data.userId);
      setIsCallActive(true);
      
      if (data.userId !== currentUser.id) {
        toast.success(`${data.username} joined the video call`);
      }
      
      setCallParticipants(prev => {
        if (prev.some(p => p.id === data.userId)) return prev;
        return [...prev, { id: data.userId, username: data.username }];
      });

      if (inCall && currentUser && currentUser.id !== data.userId) {
        console.log('Creating peer connection with new joiner:', data.userId);
        createPeerConnectionForUser(data.userId);
      }
    };

    const handleExistingCallParticipants = async (data: any) => {
      console.log('Received existing call participants:', data.participants);
      for (const participant of data.participants) {
        if (participant.id !== currentUser.id && !peerConnections.current?.[participant.id]) {
          console.log('Creating peer connection with existing participant:', participant.id);
          const pc = createPeerConnection(participant.id);
          const stream = localStream || await getLocalStream();
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
        }
      }
      
      setCallParticipants(prev => {
        const newParticipants = [...prev];
        data.participants.forEach((participant: any) => {
          if (!newParticipants.some(p => p.id === participant.id)) {
            newParticipants.push({ id: participant.id, username: participant.username });
          }
        });
        return newParticipants;
      });
    };

    // WebRTC signaling events
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    
    // Call signaling events
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('user_joined_call', handleUserJoinedCall);
    socket.on('existing_call_participants', handleExistingCallParticipants);

    return () => {
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
      socket.off('user_joined_call', handleUserJoinedCall);
      socket.off('existing_call_participants', handleExistingCallParticipants);
    };
  }, [socket, currentUser, inCall, localStream]);

  // Helper function to create peer connection for a user
  const createPeerConnectionForUser = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      const pc = createPeerConnection(userId);
      const stream = localStream || await getLocalStream();
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (socket) {
        socket.emit('webrtc_offer', {
          to: userId,
          from: currentUser.id,
          offer
        });
      }
    } catch (error) {
      console.error('Error creating peer connection for user:', error);
    }
  };

  // Start a call
  const startCall = async () => {
    if (!socket || !currentUser) return;
    
    try {
      const stream = await getLocalStream();
      setLocalStream(stream);
      setInCall(true);
      setIsCallActive(true);
      callInitiator.current = currentUser.id;
      activeCallUsers.current.add(currentUser.id);
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
      setLocalStream(stream);
      
      socket.emit('accept_call', { username: currentUser.username, userId: currentUser.id });
      setInCall(true);
      setIsCallActive(true);
      setCallIncoming(false);
      activeCallUsers.current.add(currentUser.id);
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

  // Join existing call
  const joinCall = async () => {
    if (!currentUser || !socket) return;

    try {
      console.log('Joining existing call...');
      
      const stream = await getLocalStream();
      setLocalStream(stream);
      
      setCallParticipants(prev => {
        if (prev.some(p => p.id === currentUser.id)) return prev;
        return [...prev, { id: currentUser.id, username: currentUser.username, isSelf: true }];
      });
      
      socket.emit('join_call', {
        userId: currentUser.id,
        username: currentUser.username
      });

      setInCall(true);
      console.log('Successfully joined call');
      
    } catch (error) {
      console.error('Error joining call:', error);
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
    setIsCallActive(false);
    callInitiator.current = null;
    activeCallUsers.current.clear();
    stopRingtone();
    
    if (peerConnections.current) {
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
    }
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

  // Switch camera
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
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      localStream.removeTrack(videoTrack);
      localStream.addTrack(newVideoTrack);
      
      if (peerConnections.current) {
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(newVideoTrack);
        });
      }
      
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
      isCallActive,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      joinCall,
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
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
}; 