import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Menu, X, LogOut, Volume2, VolumeX, Wifi, WifiOff, Video } from 'lucide-react';
import { useUser } from '../context/UserContext';
import UserList from './UserList';
import { soundManager } from '../utils/sounds';
import { useChat } from '../context/ChatContext';
import { useVideoCall } from '../context/VideoCallContext';

const ChatHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuteState());
  const { currentUser, setCurrentUser } = useUser();
  const { users, isConnected } = useChat();
  const navigate = useNavigate();
  const { startCall } = useVideoCall();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const handleSoundToggle = () => {
    const newMuteState = soundManager.toggleMute();
    setIsMuted(newMuteState);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">ChatterBox</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Users size={20} />
          </button>
          
          <div className="hidden md:flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? (
              <Wifi size={16} className="text-green-500" />
            ) : (
              <WifiOff size={16} className="text-red-500" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <button
            onClick={handleSoundToggle}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          {/* Video call icon button */}
          <button
            onClick={startCall}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
            title="Start Video Call"
          >
            <Video size={20} />
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <UserList isMobile={true} />
        </div>
      )}
    </header>
  );
};

export default ChatHeader;