import React, { useEffect, useRef } from 'react';
import { useVideoCall } from '../context/VideoCallContext';

const VideoCallScreen: React.FC = () => {
  const { 
    inCall, 
    callParticipants, 
    localStream, 
    endCall, 
    isMuted, 
    isCameraOn, 
    toggleMute, 
    toggleCamera, 
    switchCamera, 
    audioOutputId, 
    availableAudioOutputs, 
    setAudioOutput 
  } = useVideoCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Handle local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('Setting local video stream');
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle remote video streams
  useEffect(() => {
    console.log('Call participants updated:', callParticipants);
    callParticipants.forEach(participant => {
      if (!participant.isSelf && participant.stream) {
        console.log('Setting remote stream for:', participant.username, participant.stream);
        const videoElement = remoteVideoRefs.current[participant.id];
        if (videoElement && videoElement.srcObject !== participant.stream) {
          videoElement.srcObject = participant.stream;
          console.log('Remote stream set for:', participant.username);
        }
      }
    });
  }, [callParticipants]);

  // Set audio output for remote videos
  useEffect(() => {
    if (audioOutputId) {
      Object.values(remoteVideoRefs.current).forEach(video => {
        if (video && 'setSinkId' in video) {
          // @ts-ignore
          video.setSinkId(audioOutputId);
        }
      });
    }
  }, [audioOutputId]);

  if (!inCall) return null;

  const remoteParticipants = callParticipants.filter(p => !p.isSelf);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
        {/* Local video */}
        <div className="relative">
          <video
            ref={localVideoRef}
            className="w-full h-full rounded-lg border-2 border-green-500 object-cover"
            autoPlay
            muted
            playsInline
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            You
          </div>
          {isMuted && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
              🔇 Muted
            </div>
          )}
          {!isCameraOn && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
              📷 Off
            </div>
          )}
        </div>

        {/* Remote participants */}
        {remoteParticipants.map(participant => (
          <div key={participant.id} className="relative">
            <video
              ref={el => {
                remoteVideoRefs.current[participant.id] = el;
                if (el && participant.stream) {
                  console.log('Setting stream for video element:', participant.username);
                  el.srcObject = participant.stream;
                }
              }}
              className="w-full h-full rounded-lg border-2 border-blue-500 object-cover"
              autoPlay
              playsInline
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {participant.username}
            </div>
            {!participant.stream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                <div className="text-white text-center">
                  <div className="text-2xl mb-2">📞</div>
                  <div>Connecting...</div>
                </div>
              </div>
            )}
            {participant.stream && (
              <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                Connected
              </div>
            )}
          </div>
        ))}

        {/* Placeholder for empty slots */}
        {remoteParticipants.length === 0 && (
          <div className="flex items-center justify-center bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
            <div className="text-white text-center">
              <div className="text-2xl mb-2">📞</div>
              <div>Waiting for others to join...</div>
            </div>
          </div>
        )}
      </div>

      {/* Debug info */}
      <div className="px-8 py-2 bg-gray-800 text-white text-sm">
        <div>Local Stream: {localStream ? '✅ Active' : '❌ None'}</div>
        <div>Remote Participants: {remoteParticipants.length}</div>
        <div>Remote Streams: {remoteParticipants.filter(p => p.stream).length}</div>
      </div>

      {/* Control buttons */}
      <div className="flex justify-center space-x-4 pb-8">
        <button 
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" 
          onClick={endCall}
        >
          End Call
        </button>
        
        <button 
          className={`px-6 py-3 rounded-lg transition-colors ${
            isMuted ? 'bg-gray-400 hover:bg-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`} 
          onClick={toggleMute}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
        
        <button 
          className={`px-6 py-3 rounded-lg transition-colors ${
            isCameraOn ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-400 hover:bg-gray-500'
          }`} 
          onClick={toggleCamera}
        >
          {isCameraOn ? '📷 Camera Off' : '📷 Camera On'}
        </button>
        
        <button 
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors" 
          onClick={switchCamera}
        >
          🔄 Switch Camera
        </button>
        
        {availableAudioOutputs.length > 0 && (
          <select
            className="px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-700"
            value={audioOutputId || ''}
            onChange={e => setAudioOutput(e.target.value)}
          >
            <option value="">🔊 Default Speaker</option>
            {availableAudioOutputs.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Speaker ${device.deviceId.slice(0, 8)}...`}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default VideoCallScreen; 