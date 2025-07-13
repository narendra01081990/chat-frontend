import React, { useState, useEffect } from 'react';
import { useVideoCall } from '../context/VideoCallContext';

const VideoCallDebug: React.FC = () => {
  const { 
    inCall, 
    callParticipants, 
    localStream, 
    isCallActive,
    peerConnections 
  } = useVideoCall();
  
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!inCall) return;

    const updateDebugInfo = () => {
      const info = {
        timestamp: new Date().toISOString(),
        inCall,
        isCallActive,
        localStream: localStream ? {
          id: localStream.id,
          tracks: localStream.getTracks().map(track => ({
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState
          }))
        } : null,
        participants: callParticipants.map(p => ({
          id: p.id,
          username: p.username,
          isSelf: p.isSelf,
          hasStream: !!p.stream,
          streamId: p.stream?.id
        })),
        peerConnections: Object.keys(peerConnections.current).map(userId => {
          const pc = peerConnections.current[userId];
          return {
            userId,
            connectionState: pc.connectionState,
            iceConnectionState: pc.iceConnectionState,
            signalingState: pc.signalingState,
            hasLocalDescription: !!pc.localDescription,
            hasRemoteDescription: !!pc.remoteDescription
          };
        })
      };
      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [inCall, callParticipants, localStream, isCallActive, peerConnections]);

  if (!inCall) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm"
      >
        {showDebug ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {showDebug && (
        <div className="mt-2 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md text-xs">
          <h3 className="font-bold mb-2">Video Call Debug Info</h3>
          <pre className="whitespace-pre-wrap overflow-auto max-h-64">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default VideoCallDebug; 