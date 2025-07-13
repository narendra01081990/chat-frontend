import React, { useRef, useEffect } from 'react';
import { useVideoCall } from '../context/VideoCallContext';

const VideoCallScreen: React.FC = () => {
  const {
    inCall,
    localStream,
    remoteStream,
    endCall,
    isMuted,
    isCameraOn,
    toggleMute,
    toggleCamera,
    callState
  } = useVideoCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!inCall) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-80 h-48 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-lg bg-black bg-opacity-60">
              {callState === 'connecting' ? 'Connecting...' : 'Waiting for other user...'}
            </div>
          )}
        </div>
        <div className="absolute bottom-8 right-8 w-32 h-20 bg-gray-800 rounded-md overflow-hidden shadow-md border-2 border-white">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        </div>
        <div className="flex space-x-4 mt-8">
          <button
            className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xl shadow-lg"
            onClick={endCall}
            title="End Call"
          >
            &#128222;
          </button>
          <button
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg ${isMuted ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg ${isCameraOn ? 'bg-white text-gray-800' : 'bg-gray-600 text-white'}`}
            onClick={toggleCamera}
            title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isCameraOn ? '📷' : '🚫'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallScreen; 