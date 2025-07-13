import React, { useState } from 'react';
import { useVideoCall } from '../context/VideoCallContext';
import { useUser } from '../context/UserContext';

const VideoCallButton: React.FC = () => {
  const { startCall, joinCall, inCall, isCallActive } = useVideoCall();
  const { currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartCall = async () => {
    if (!currentUser) {
      alert('Please login first');
      return;
    }

    setIsLoading(true);
    try {
      await startCall();
      console.log('Call started successfully');
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call. Please check your camera and microphone permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCall = async () => {
    if (!currentUser) {
      alert('Please login first');
      return;
    }

    setIsLoading(true);
    try {
      await joinCall();
      console.log('Joined call successfully');
    } catch (error) {
      console.error('Failed to join call:', error);
      alert('Failed to join call. Please check your camera and microphone permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  if (inCall) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-green-600 font-medium">In Call</span>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleStartCall}
        disabled={isLoading}
        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        )}
        <span>{isLoading ? 'Starting...' : 'Start Call'}</span>
      </button>

      {isCallActive && (
        <button
          onClick={handleJoinCall}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 1v12h10V4H5z" clipRule="evenodd" />
            </svg>
          )}
          <span>{isLoading ? 'Joining...' : 'Join Call'}</span>
        </button>
      )}
    </div>
  );
};

export default VideoCallButton; 