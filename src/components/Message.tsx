import React, { useState, useRef, useEffect } from 'react';
import { MessageType, MessageActionType, FileData } from '../types';
import { useUser } from '../context/UserContext';
import UserAvatar from './UserAvatar';
import MessageActions from './MessageActions';
import { useSwipeable } from 'react-swipeable';
import { Reply, MoreVertical, Heart, Pin, Flag } from 'lucide-react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import ImagePreviewModal from './ImagePreviewModal';
import { formatFileSize, getFileIcon } from '../utils/fileUpload';
import { formatDistanceToNow } from 'date-fns';

interface MessageProps {
  message: MessageType;
  currentUserId: string;
  onAction: (action: MessageActionType) => void;
  onReply: (message: MessageType) => void;
}

const Message: React.FC<MessageProps> = ({ message, currentUserId, onAction, onReply }) => {
  const { currentUser } = useUser();
  const isCurrentUser = message.sender.id === currentUser?.id;
  const [showActions, setShowActions] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const controls = useAnimation();
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 100], [0, 1]);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle swipe actions
  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (isMobile && !isCurrentUser) {
        x.set(e.deltaX);
      }
    },
    onSwipedRight: () => {
      if (!isCurrentUser) {
        onAction({ type: 'reply', messageId: message.id });
      }
      controls.start({ x: 0 });
    },
    onSwiped: () => {
      controls.start({ x: 0 });
    },
    trackMouse: !isMobile,
    preventDefaultTouchmoveEvent: true,
    delta: 10,
    swipeDuration: 500,
  });

  const handleImageClick = (file: FileData) => {
    if (file.type.startsWith('image/')) {
      setSelectedImage({ url: file.url, name: file.name });
      setShowImageModal(true);
    }
  };

  const handleAction = (type: MessageActionType['type']) => {
    const action: MessageActionType = {
      type,
      messageId: message.id,
    };
    onAction(action);
    setShowActions(false);
  };

  const renderAttachment = (file: FileData) => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="mt-2">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(file)}
          />
          <p className="text-xs text-gray-500 mt-1">{file.name}</p>
        </div>
      );
    } else {
      return (
        <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center space-x-3">
          <span className="text-2xl">{getFileIcon(file.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
          <a
            href={file.url}
            download={file.name}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Download
          </a>
        </div>
      );
    }
  };

  return (
    <div 
      ref={messageRef}
      {...handlers}
      className={`relative flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      <motion.div 
        {...handlers}
        animate={controls}
        style={{ x }}
        className={`relative flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}
        onClick={() => setShowActions(!showActions)}
      >
        {!isCurrentUser && (
          <div className={
            isMobile
              ? "mr-1 flex-shrink-0"
              : "mr-2 flex-shrink-0"
          }>
            <UserAvatar user={message.sender} size="sm" />
          </div>
        )}
        
        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
          {!isCurrentUser && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {message.sender.username}
            </span>
          )}
          
          {message.replyTo && (
            <div className="mb-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs">
              <span className="text-indigo-600 dark:text-indigo-400">
                {message.replyTo.sender.username}
              </span>
              <p className="text-gray-600 dark:text-gray-300 truncate">
                {message.replyTo.content}
              </p>
            </div>
          )}
          
          <div 
            className={`rounded-2xl py-2 px-4 inline-block ${
              isCurrentUser 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-sm'
            }`}
          >
            {message.content && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2">
                {message.attachments.map((file) => (
                  <div key={file.id}>
                    {renderAttachment(file)}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center mt-1 space-x-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
            </span>
            
            {isCurrentUser && message.status && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                • {message.status === 'sent' ? 'Sent' : 'Read'}
              </span>
            )}
          </div>
        </div>
        
        {isCurrentUser && (
          <div className="ml-2 flex-shrink-0">
            <UserAvatar user={message.sender} size="sm" />
          </div>
        )}

        {/* Reply icon - only show on hover for desktop, always visible on mobile */}
        {!isCurrentUser && (
          <motion.button
            style={{ opacity: isMobile ? opacity : undefined }}
            onClick={(e) => {
              e.stopPropagation();
              onAction({ type: 'reply', messageId: message.id });
            }}
            className={`absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${
              isMobile ? '' : 'opacity-0 group-hover:opacity-100'
            } transition-opacity`}
          >
            <Reply size={16} />
          </motion.button>
        )}
      </motion.div>

      {showActions && (
        <div className="absolute top-0 right-0 mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="py-1">
            <button
              onClick={() => onReply(message)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <Reply size={16} />
              <span>Reply</span>
            </button>
            <button
              onClick={() => handleAction('react')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <Heart size={16} />
              <span>React</span>
            </button>
            <button
              onClick={() => handleAction('pin')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <Pin size={16} />
              <span>Pin</span>
            </button>
            <button
              onClick={() => handleAction('report')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-red-600 dark:text-red-400"
            >
              <Flag size={16} />
              <span>Report</span>
            </button>
          </div>
        </div>
      )}

      <ImagePreviewModal
        isOpen={showImageModal}
        imageUrl={selectedImage?.url || ''}
        fileName={selectedImage?.name}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImage(null);
        }}
      />
    </div>
  );
};

export default Message;