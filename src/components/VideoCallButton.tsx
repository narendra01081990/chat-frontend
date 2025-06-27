import React from 'react';
import { useVideoCall } from '../context/VideoCallContext';

const VideoCallButton: React.FC = () => {
  const { startCall } = useVideoCall();
  return (
    <button
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      onClick={startCall}
    >
      Start Video Call
    </button>
  );
};

export default VideoCallButton; 