import React from 'react';
import { useVideoCall } from '../context/VideoCallContext';

const IncomingCallModal: React.FC = () => {
  const { callIncoming, acceptCall, rejectCall } = useVideoCall();
  if (!callIncoming) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4">Incoming Video Call</h2>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg" onClick={acceptCall}>Accept</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg" onClick={rejectCall}>Reject</button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal; 