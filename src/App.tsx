import React from 'react';
import ChatHeader from './components/ChatHeader';
import VideoCallScreen from './components/VideoCallScreen';
import { VideoCallProvider } from './context/VideoCallContext';

const App: React.FC = () => {
  return (
    <VideoCallProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col">
        <ChatHeader />
        <VideoCallScreen />
      </div>
    </VideoCallProvider>
  );
};

export default App;