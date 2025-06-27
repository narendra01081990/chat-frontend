import React from 'react';
import { MessageType, MessageActionType } from '../types';
import { Reply, Pin, Flag, Smile } from 'lucide-react';

interface MessageActionsProps {
  message: MessageType;
  onAction: (action: MessageActionType) => void;
  onClose: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ message, onAction, onClose }) => {
  const handleAction = (type: MessageActionType['type']) => {
    onAction({ type, messageId: message.id });
    onClose();
  };

  return (
    <div className="absolute right-0 top-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
      <div className="space-y-1">
        <button
          onClick={() => handleAction('reply')}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <Reply size={16} />
          <span>Reply</span>
        </button>
        
        <button
          onClick={() => handleAction('react')}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <Smile size={16} />
          <span>React</span>
        </button>
        
        <button
          onClick={() => handleAction('pin')}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <Pin size={16} />
          <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
        </button>
        
        <button
          onClick={() => handleAction('report')}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <Flag size={16} />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
};

export default MessageActions; 