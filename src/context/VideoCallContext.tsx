import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const SIGNALING_SERVER_URL = 'http://localhost:5000'; // Change to your backend URL

interface VideoCallContextProps {
  inCall: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOn: boolean;
  callState: 'idle' | 'connecting' | 'in-call';
  startCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const VideoCallContext = createContext<VideoCallContextProps>({} as any);

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'in-call'>('idle');

  const socketRef = useRef<any>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const userId = useRef<string>(Math.random().toString(36).substr(2, 9));
  const remoteUserId = useRef<string | null>(null);

  // Start a call (offerer)
  const startCall = useCallback(async () => {
    setCallState('connecting');
    setInCall(true);
    socketRef.current = io(SIGNALING_SERVER_URL);
    socketRef.current.emit('join', { userId: userId.current });
    socketRef.current.on('user-joined', async ({ userId: otherId }: any) => {
      if (otherId !== userId.current && !remoteUserId.current) {
        remoteUserId.current = otherId;
        await createOffer();
      }
    });
    socketRef.current.on('call-made', async ({ offer, from }: any) => {
      remoteUserId.current = from;
      await handleOffer(offer);
    });
    socketRef.current.on('answer-made', async ({ answer }: any) => {
      await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
      setCallState('in-call');
    });
    socketRef.current.on('ice-candidate', async ({ candidate }: any) => {
      try {
        await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    });
    await getMedia();
  }, []);

  // End call
  const endCall = useCallback(() => {
    setInCall(false);
    setCallState('idle');
    setRemoteStream(null);
    peerRef.current?.close();
    peerRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    setLocalStream((stream) => {
      stream?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      localStream?.getAudioTracks().forEach((track) => (track.enabled = prev));
      return !prev;
    });
  }, [localStream]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => {
      localStream?.getVideoTracks().forEach((track) => (track.enabled = !prev));
      return !prev;
    });
  }, [localStream]);

  // Get user media
  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
  };

  // Create offer
  const createOffer = async () => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });
    localStream?.getTracks().forEach((track) => {
      peerRef.current?.addTrack(track, localStream);
    });
    peerRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate && remoteUserId.current) {
        socketRef.current.emit('ice-candidate', {
          to: remoteUserId.current,
          candidate: event.candidate,
          from: userId.current
        });
      }
    };
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    if (remoteUserId.current) {
      socketRef.current.emit('call-user', {
        to: remoteUserId.current,
        offer,
        from: userId.current
      });
    }
  };

  // Handle offer (answerer)
  const handleOffer = async (offer: any) => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });
    localStream?.getTracks().forEach((track) => {
      peerRef.current?.addTrack(track, localStream);
    });
    peerRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate && remoteUserId.current) {
        socketRef.current.emit('ice-candidate', {
          to: remoteUserId.current,
          candidate: event.candidate,
          from: userId.current
        });
      }
    };
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    if (remoteUserId.current) {
      socketRef.current.emit('make-answer', {
        to: remoteUserId.current,
        answer,
        from: userId.current
      });
    }
    setCallState('in-call');
  };

  return (
    <VideoCallContext.Provider
      value={{
        inCall,
        localStream,
        remoteStream,
        isMuted,
        isCameraOn,
        callState,
        startCall,
        endCall,
        toggleMute,
        toggleCamera
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => useContext(VideoCallContext); 