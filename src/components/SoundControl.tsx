import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/sounds';

const SoundControl: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    const newMutedState = soundManager.toggleMute();
    setIsMuted(newMutedState);
  };

  return (
    <button
      onClick={toggleSound}
      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      title={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
};

export default SoundControl; 