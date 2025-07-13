import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import { UserProvider } from './context/UserContext';
import { ChatProvider } from './context/ChatContext';
import { VideoCallProvider } from './context/VideoCallContext';
import IncomingCallModal from './components/IncomingCallModal';
import VideoCallScreen from './components/VideoCallScreen';
import VideoCallDebug from './components/VideoCallDebug';
import VideoCallTest from './components/VideoCallTest';
import SimpleVideoTest from './components/SimpleVideoTest';

function App() {
  return (
    <UserProvider>
      <ChatProvider>
        <VideoCallProvider>
          <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-900 dark:to-indigo-950">
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
            <IncomingCallModal />
            <VideoCallScreen />
            <VideoCallDebug />
            <VideoCallTest />
            <SimpleVideoTest />
          </div>
        </VideoCallProvider>
      </ChatProvider>
    </UserProvider>
  );
}

export default App;