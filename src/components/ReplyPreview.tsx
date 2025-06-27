import React from 'react';
import { ReplyPreviewType } from '../types';
import { X } from 'lucide-react';

interface ReplyPreviewProps {
  reply: ReplyPreviewType;
  onCancel: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ reply, onCancel }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2">
      <div className="flex items-start space-x-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Replying to {reply.sender.username}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {reply.content}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ReplyPreview; 