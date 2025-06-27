import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageType, UserType, UserEvent, ReplyPreviewType, MessageActionType, FileData } from '../types';
import { useUser } from './UserContext';
import { toast } from 'react-toastify';
import { soundManager } from '../utils/sounds';
import { getSocketUrl } from '../config';

interface ChatContextType {
  messages: MessageType[];
  users: UserType[];
  sendMessage: (content: string, replyTo?: ReplyPreviewType, files?: FileData[]) => void;
  sendTypingStatus: (isTyping: boolean) => void;
  isConnected: boolean;
  typingUsers: UserType[];
  handleMessageAction: (action: MessageActionType) => void;
  replyPreview?: ReplyPreviewType;
  setReplyPreview: (preview?: ReplyPreviewType) => void;
  handleEmojiSelect: (emoji: string) => void;
  socket: Socket | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<UserType[]>([]);
  const { currentUser } = useUser();
  const [sentMessageIds] = useState(new Set<string>());
  const processedEvents = useRef<Set<string>>(new Set());
  const [replyPreview, setReplyPreview] = useState<ReplyPreviewType | undefined>();
  // Track recent user join toasts to prevent duplicates
  const recentUserJoinToasts = useRef<{ [username: string]: number }>({});
  // Track processed join event IDs to avoid duplicate system messages
  const processedJoinEvents = useRef<Set<string>>(new Set());

  // Function to show toast with event tracking
  const showToast = (message: string, eventId: string, type: 'info' | 'success' | 'error' = 'info') => {
    // Check if we've already processed this event
    if (processedEvents.current.has(eventId)) {
      return;
    }

    // Add the event ID to our processed set
    processedEvents.current.add(eventId);

    // Show the toast
    toast[type](message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      toastId: eventId // Add toastId to prevent duplicate toasts
    });

    // Clean up processed events after 5 seconds
    setTimeout(() => {
      processedEvents.current.delete(eventId);
    }, 5000);
  };

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat server at:', socketUrl);
      
      // Re-join chat if user is available
      if (currentUser) {
        newSocket.emit('user_join', { username: currentUser.username, id: currentUser.id });
      }
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Disconnected from chat server:', reason);
      
      // Don't clear users on disconnect, only on actual leave
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('Server error:', data.message);
      showToast(data.message, `error-${Date.now()}`, 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('error');
      newSocket.close();
    };
  }, [currentUser]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Handler functions
    const handleChatHistory = (history: MessageType[]) => setMessages(history);

    const handleNewMessage = (data: MessageType) => {
      if (!data.sender || data.sender.id === currentUser.id || sentMessageIds.has(data.id)) return;
      setMessages(prev => [...prev, data]);
      sentMessageIds.add(data.id);
      soundManager.playSound('message');
    };

    const handleUserJoined = (data: UserEvent) => {
      console.log('User joined:', data.username);
      setUsers(data.users);
      if (data.username !== currentUser.username && data.eventId) {
        const now = Date.now();
        const lastToast = recentUserJoinToasts.current[data.username] || 0;
        if (now - lastToast > 60000) {
          showToast(`${data.username} joined the chat`, data.eventId, 'success');
          soundManager.playSound('userJoin');
          recentUserJoinToasts.current[data.username] = now;
        }
      }
      setMessages(prev => {
        // Only add if not already present and not for yourself
        if (
          prev.some(m => m.id === `system-join-${data.eventId}`) ||
          data.username === currentUser.username
        ) {
          return prev;
        }
        return [
          ...prev,
          {
            id: `system-join-${data.eventId}`,
            content: `${data.username} joined the chat`,
            sender: null,
            timestamp: Date.now(),
            status: 'read',
            isSystem: true
          }
        ];
      });
      processedJoinEvents.current.add(data.eventId);
    };

    const handleUserLeft = (data: UserEvent) => {
      setUsers(data.users);
      setTypingUsers(prev => prev.filter(user => data.users.some(u => u.id === user.id)));
      if (data.username !== currentUser.username && data.eventId) {
        showToast(`${data.username} left the chat`, data.eventId, 'info');
      }
    };

    const handleCurrentUsers = (currentUsers: UserType[]) => setUsers(currentUsers);

    const handleUserTyping = (data: { id: string; username: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const user = users.find(u => u.id === data.id);
        if (!user) return prev;
        if (data.isTyping) {
          return prev.some(u => u.id === user.id) ? prev : [...prev, { ...user, isTyping: true }];
        }
        return prev.filter(u => u.id !== user.id);
      });
    };

    // Register handlers
    socket.on('chat_history', handleChatHistory);
    socket.on('new_message', handleNewMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('current_users', handleCurrentUsers);
    socket.on('user_typing', handleUserTyping);

    // Cleanup: remove handlers
    return () => {
      socket.off('chat_history', handleChatHistory);
      socket.off('new_message', handleNewMessage);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('current_users', handleCurrentUsers);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, currentUser]);

  const handleMessageAction = (action: MessageActionType) => {
    switch (action.type) {
      case 'reply':
        const messageToReply = messages.find(m => m.id === action.messageId);
        if (messageToReply && messageToReply.sender) {
          setReplyPreview({
            id: messageToReply.id,
            messageId: messageToReply.id,
            content: messageToReply.content,
            sender: {
              username: messageToReply.sender.username,
              id: messageToReply.sender.id
            }
          });
        }
        break;
      case 'react':
        // Handle reactions
        break;
      case 'pin':
        // Handle pinning
        break;
      case 'report':
        // Handle reporting
        break;
    }
  };

  const sendMessage = (content: string, replyTo?: ReplyPreviewType, files?: FileData[]) => {
    // Allow sending if there's content OR files, not requiring both
    const hasContent = content && content.trim().length > 0;
    const hasFiles = files && files.length > 0;
    
    if (!socket || !currentUser || (!hasContent && !hasFiles)) {
      console.log('Send message validation failed:', { hasContent, hasFiles, socket: !!socket, currentUser: !!currentUser });
      return;
    }

    const messageId = Date.now().toString();
    const tempMessage: MessageType = {
      id: messageId,
      content: content || '',
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        isOnline: true,
        avatarColor: currentUser.avatarColor
      },
      timestamp: Date.now(),
      status: 'sent',
      replyTo: replyTo,
      attachments: files
    };

    console.log('Sending message:', { content, files: files?.length, messageId });
    
    setMessages(prev => [...prev, tempMessage]);
    sentMessageIds.add(messageId);

    socket.emit('send_message', { 
      content: content || '', 
      messageId,
      replyTo: replyTo ? {
        id: replyTo.messageId,
        content: replyTo.content,
        sender: replyTo.sender
      } : undefined,
      attachments: files
    });

    // Clear reply preview after sending
    if (replyTo) {
      setReplyPreview(undefined);
    }
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if (socket) {
      socket.emit('typing', isTyping);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!socket || !currentUser) return;
    
    const messageId = Date.now().toString();
    const tempMessage: MessageType = {
      id: messageId,
      content: emoji,
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        isOnline: true,
        avatarColor: currentUser.avatarColor
      },
      timestamp: Date.now(),
      status: 'sent'
    };

    setMessages(prev => [...prev, tempMessage]);
    sentMessageIds.add(messageId);

    socket.emit('send_message', { 
      content: emoji, 
      messageId
    });
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      users, 
      sendMessage, 
      sendTypingStatus, 
      isConnected, 
      typingUsers,
      handleMessageAction,
      replyPreview,
      setReplyPreview,
      handleEmojiSelect,
      socket
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};