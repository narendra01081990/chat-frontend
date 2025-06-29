import React from 'react';
import { useVideoCall } from '../context/VideoCallContext';

const VideoCallButton: React.FC = () => {
  const { 
    inCall, 
    callIncoming, 
    isCallActive, 
    startCall, 
    joinCall 
  } = useVideoCall();

  if (inCall) return null;

  return (
    <div className="flex space-x-2">
      {isCallActive && !callIncoming && (
        <button
          onClick={joinCall}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <span>📞</span>
          <span>Join VC</span>
        </button>
      )}
      
      <button
        onClick={startCall}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
      >
        <span>📹</span>
        <span>Start VC</span>
      </button>
    </div>
  );
};

export default VideoCallButton; 