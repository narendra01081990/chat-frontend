export interface UserType {
  id: string;
  username: string;
  isOnline: boolean;
  avatarColor: string;
}

export interface MessageType {
  id: string;
  content: string;
  sender: UserType;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
}