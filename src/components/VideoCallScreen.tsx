import React from 'react';
import { useVideoCall } from '../context/VideoCallContext';

const VideoCallScreen: React.FC = () => {
  const { inCall, callParticipants, localStream, endCall, isMuted, isCameraOn, toggleMute, toggleCamera, switchCamera, audioOutputId, availableAudioOutputs, setAudioOutput } = useVideoCall();
  if (!inCall) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 p-8">
        {/* Local video */}
        <video
          className="rounded-lg border-2 border-green-500"
          autoPlay
          muted
          playsInline
          ref={video => {
            if (video && localStream) video.srcObject = localStream;
          }}
        />
        {/* Remote participants */}
        {callParticipants.filter(p => !p.isSelf).map(p => (
          <video
            key={p.id}
            className="rounded-lg border-2 border-blue-500"
            autoPlay
            playsInline
            ref={video => {
              if (video && p.stream) video.srcObject = p.stream;
            }}
          />
        ))}
      </div>
      <div className="flex justify-center space-x-4 pb-8">
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg" onClick={endCall}>End Call</button>
        <button className={`px-4 py-2 rounded-lg ${isMuted ? 'bg-gray-400' : 'bg-blue-600 text-white'}`} onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
        <button className={`px-4 py-2 rounded-lg ${isCameraOn ? 'bg-blue-600 text-white' : 'bg-gray-400'}`} onClick={toggleCamera}>{isCameraOn ? 'Camera Off' : 'Camera On'}</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg" onClick={switchCamera}>Switch Camera</button>
        {availableAudioOutputs.length > 0 && (
          <select
            className="px-2 py-2 rounded-lg border border-gray-300"
            value={audioOutputId || ''}
            onChange={e => setAudioOutput(e.target.value)}
          >
            <option value="">Default Speaker</option>
            {availableAudioOutputs.map(device => (
              <option key={device.deviceId} value={device.deviceId}>{device.label || `Speaker ${device.deviceId}`}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default VideoCallScreen; 