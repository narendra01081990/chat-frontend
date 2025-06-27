import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import { useUser } from '../context/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { MessageType, MessageActionType } from '../types';
import Message from './Message';

interface MessageListProps {
  onMessageAction: (action: MessageActionType) => void;
}

const MessageList: React.FC<MessageListProps> = ({ onMessageAction }) => {
  const { messages, typingUsers } = useChat();
  const { currentUser } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'just now';
    }
  };

  const getTypingIndicator = () => {
    const otherTypingUsers = typingUsers.filter(user => user.id !== currentUser?.id);
    if (otherTypingUsers.length === 0) return null;
    if (otherTypingUsers.length === 1) {
      return `${otherTypingUsers[0].username} is typing...`;
    }
    const usernames = otherTypingUsers.map(user => user.username).join(', ');
    return `${usernames} are typing...`;
  };

  return (
    <div className="space-y-4 p-4 flex-1 overflow-y-auto relative">
      {messages.length === 0 && typingUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60">
          <div className="text-gray-400 dark:text-gray-500 text-center">
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation by typing a message below</p>
          </div>
        </div>
      ) : (
        <>
          <AnimatePresence initial={false}>
            {messages.map((message: MessageType) => {
              if (message.isSystem) {
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-center my-2">
                      <div className="bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-200 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                        {message.content}
                      </div>
                    </div>
                  </motion.div>
                );
              }
              if (!message.sender /*|| !message.content*/) {
                console.warn('Invalid message format:', message);
                return null;
              }

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Message 
                    message={message} 
                    onAction={onMessageAction}
                    currentUserId={currentUser?.id || ''}
                    onReply={() => {}}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
          {getTypingIndicator() && (
            <div className="text-gray-500 dark:text-gray-400 text-sm italic">
              {getTypingIndicator()}
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;