import React from 'react';
import { Video } from 'lucide-react';
import { useVideoCall } from '../context/VideoCallContext';

const ChatHeader: React.FC = () => {
  const { startCall } = useVideoCall();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">VideoCall App</h1>
        <button
          onClick={startCall}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title="Start Video Call"
        >
          <Video size={24} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;