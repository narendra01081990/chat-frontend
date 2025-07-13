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
    const localVideo = localVideoRef?.current;
    if (localVideo && localStream) {
      console.log('Setting local video stream');
      localVideo.srcObject = localStream;
      localVideo.play().catch(console.error);
    }
  }, [localStream]);

  // Handle remote video streams
  useEffect(() => {
    console.log('Call participants updated:', callParticipants);
    callParticipants.forEach(participant => {
      if (!participant.isSelf && participant.stream) {
        console.log('Setting remote stream for:', participant.username, participant.stream);
        const videoElement = remoteVideoRefs?.current?.[participant.id];
        if (videoElement && videoElement.srcObject !== participant.stream) {
          videoElement.srcObject = participant.stream;
          videoElement.play().catch(console.error);
          console.log('Remote stream set for:', participant.username);
        }
      }
    });
  }, [callParticipants]);

  // Set audio output for remote videos
  useEffect(() => {
    if (audioOutputId && remoteVideoRefs?.current) {
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
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold text-lg">Video Call</span>
        </div>
        <div className="text-white text-sm">
          {remoteParticipants.length + 1} participants
        </div>
      </div>

      {/* Main Video Grid */}
      <div className="flex-1 p-4">
        {remoteParticipants.length === 0 ? (
          // Single user view (caller waiting)
          <div className="h-full flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <div className="text-sm font-medium">You</div>
                <div className="text-xs opacity-75">Waiting for others...</div>
              </div>
              {isMuted && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                  🔇
                </div>
              )}
              {!isCameraOn && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                  📷
                </div>
              )}
            </div>
          </div>
        ) : (
          // Multiple participants view
          <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local video (smaller) */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-3 left-3 text-white">
                <div className="text-sm font-medium">You</div>
              </div>
              {isMuted && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                  🔇
                </div>
              )}
              {!isCameraOn && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                  📷
                </div>
              )}
            </div>

            {/* Remote participants */}
            {remoteParticipants.map(participant => (
              <div key={participant.id} className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                <video
                  ref={el => {
                    if (remoteVideoRefs?.current) {
                      remoteVideoRefs.current[participant.id] = el;
                      if (el && participant.stream) {
                        console.log('Setting stream for video element:', participant.username);
                        el.srcObject = participant.stream;
                        el.play().catch(console.error);
                      }
                    }
                  }}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-3 left-3 text-white">
                  <div className="text-sm font-medium">{participant.username}</div>
                </div>
                {!participant.stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                    <div className="text-white text-center">
                      <div className="text-2xl mb-2">📞</div>
                      <div className="text-sm">Connecting...</div>
                    </div>
                  </div>
                )}
                {participant.stream && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                    Live
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm p-4">
        {/* Primary Controls */}
        <div className="flex justify-center space-x-4 mb-4">
          <button 
            className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={endCall}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 1v12h10V4H5z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl ${
              isMuted ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-800'
            }`} 
            onClick={toggleMute}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button 
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl ${
              isCameraOn ? 'bg-white hover:bg-gray-100 text-gray-800' : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`} 
            onClick={toggleCamera}
          >
            {isCameraOn ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            )}
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="flex justify-center space-x-3">
          <button 
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full text-sm transition-all duration-200"
            onClick={switchCamera}
          >
            🔄 Switch
          </button>
          
          {availableAudioOutputs.length > 0 && (
            <select
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full text-sm transition-all duration-200 border-none outline-none"
              value={audioOutputId || ''}
              onChange={e => setAudioOutput(e.target.value)}
            >
              <option value="">🔊 Speaker</option>
              {availableAudioOutputs.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${device.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallScreen; 