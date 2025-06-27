import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import UserList from '../components/UserList';
import { useUser } from '../context/UserContext';
import { useChat } from '../context/ChatContext';

const ChatPage: React.FC = () => {
  const { currentUser } = useUser();
  const { 
    sendMessage, 
    handleMessageAction, 
    replyPreview, 
    setReplyPreview,
    isConnected
  } = useChat();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // If no user is logged in, redirect to login page
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSendMessage = (content: string, attachments?: any[]) => {
    sendMessage(content, replyPreview, attachments);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col md:flex-row"
    >
      {/* User list - hidden on mobile, visible on tablet and above */}
      <div className="hidden md:block md:w-64 lg:w-80 bg-white dark:bg-gray-800 shadow-lg">
        <UserList />
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden">
        <ChatHeader />
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4"
        >
          <MessageList onMessageAction={handleMessageAction} />
        </div>
        
        <MessageInput 
          onSendMessage={handleSendMessage}
          replyTo={replyPreview || null}
          onCancelReply={() => setReplyPreview(undefined)}
          isConnected={isConnected}
        />
      </div>
    </motion.div>
  );
};

export default ChatPage;