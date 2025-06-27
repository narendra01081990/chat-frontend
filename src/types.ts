export interface UserType {
  id: string;
  username: string;
  avatarColor: string;
  isOnline: boolean;
  isTyping?: boolean;
}

export interface MessageType {
  id: string;
  content: string;
  sender: UserType | null;
  timestamp: number;
  status: 'sent' | 'read';
  replyTo?: {
    id: string;
    content: string;
    sender: {
      username: string;
      id: string;
    };
  };
  reactions?: {
    [key: string]: string[]; // emoji: userIds
  };
  isPinned?: boolean;
  isReported?: boolean;
  attachments?: FileData[];
  isSystem?: boolean;
}

export interface UserEvent {
  username: string;
  users: UserType[];
  eventId: string;
}

export interface ReplyPreviewType {
  id: string;
  messageId: string;
  content: string;
  sender: {
    username: string;
    id: string;
  };
}

export interface MessageActionType {
  type: 'reply' | 'react' | 'pin' | 'report';
  messageId: string;
  data?: any;
}

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: string;
}