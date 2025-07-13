import React, { useState } from 'react';
import { useVideoCall } from '../context/VideoCallContext';
import { useUser } from '../context/UserContext';

const VideoCallTest: React.FC = () => {
  const { 
    inCall, 
    callParticipants, 
    localStream, 
    isCallActive,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    joinCall
  } = useVideoCall();
  const { currentUser } = useUser();
  const [testMode, setTestMode] = useState(false);

  if (!testMode) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setTestMode(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
        >
          Test Video Call
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Video Call Test</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current Status:</h3>
            <ul className="text-sm space-y-1">
              <li>In Call: {inCall ? 'Yes' : 'No'}</li>
              <li>Call Active: {isCallActive ? 'Yes' : 'No'}</li>
              <li>Local Stream: {localStream ? 'Available' : 'Not Available'}</li>
              <li>Participants: {callParticipants.length}</li>
              <li>Current User: {currentUser?.username}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Actions:</h3>
            <div className="space-y-2">
              <button
                onClick={startCall}
                className="w-full bg-green-600 text-white px-4 py-2 rounded"
              >
                Start Call
              </button>
              
              <button
                onClick={joinCall}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded"
              >
                Join Call
              </button>
              
              <button
                onClick={endCall}
                className="w-full bg-red-600 text-white px-4 py-2 rounded"
              >
                End Call
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Participants:</h3>
            <ul className="text-sm space-y-1">
              {callParticipants.map(participant => (
                <li key={participant.id}>
                  {participant.username} {participant.isSelf ? '(You)' : ''} 
                  {participant.stream ? ' - Has Stream' : ' - No Stream'}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <div className="text-xs bg-gray-100 p-2 rounded">
              <p>Local Stream ID: {localStream?.id || 'None'}</p>
              <p>Local Tracks: {localStream?.getTracks().map(t => t.kind).join(', ') || 'None'}</p>
              <p>Call Participants: {callParticipants.length}</p>
              <p>Remote Streams: {callParticipants.filter(p => !p.isSelf && p.stream).length}</p>
            </div>
          </div>

          <button
            onClick={() => setTestMode(false)}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded"
          >
            Close Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallTest; 