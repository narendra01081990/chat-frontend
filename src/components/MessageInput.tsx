import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { FileData } from '../utils/fileUpload';
import { ReplyPreviewType } from '../types';
import FileAttachment from './FileAttachment';
import ReplyPreview from './ReplyPreview';

interface MessageInputProps {
  onSendMessage: (message: string, attachments?: FileData[]) => void;
  replyTo?: ReplyPreviewType | null;
  onCancelReply?: () => void;
  isConnected: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyTo,
  onCancelReply,
  isConnected
}) => {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    // Allow sending if there's text OR files, not requiring both
    if (!message.trim() && selectedFiles.length === 0) return;
    if (!isConnected) return;

    console.log('Sending message from MessageInput:', { 
      message: message.trim(), 
      files: selectedFiles.length,
      isConnected 
    });

    onSendMessage(message.trim(), selectedFiles.length > 0 ? selectedFiles : undefined);
    setMessage('');
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = message;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    
    setMessage(newText);
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleFileSelect = (files: FileData[]) => {
    setSelectedFiles(files);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {/* Reply Preview */}
      {replyTo && (
        <ReplyPreview
          reply={replyTo}
          onCancel={onCancelReply || (() => {})}
        />
      )}

      {/* File Attachments */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file) => (
              <div key={file.id} className="flex items-center space-x-2 text-sm">
                <span>{file.name}</span>
                <button
                  onClick={() => setSelectedFiles(selectedFiles.filter(f => f.id !== file.id))}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end space-x-2">
        {/* File Attachment */}
        <FileAttachment
          onFileSelect={handleFileSelect}
          selectedFiles={selectedFiles}
        />

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={1}
            maxLength={1000}
            disabled={!isConnected}
          />
          
          {/* Character count */}
          <div className="absolute bottom-1 right-2 text-xs text-gray-400">
            {message.length}/1000
          </div>
        </div>

        {/* Emoji Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Add emoji"
          >
            <Smile size={20} />
          </button>
          
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full right-0 mb-2 z-50"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={300}
                height={400}
                searchPlaceholder="Search emoji..."
              />
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && selectedFiles.length === 0) || !isConnected}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mt-2 text-sm text-red-500 text-center">
          Disconnected. Trying to reconnect...
        </div>
      )}
    </div>
  );
};

export default MessageInput;