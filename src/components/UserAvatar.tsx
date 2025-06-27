import React from 'react';
import { UserType } from '../types';

interface UserAvatarProps {
  user: UserType;
  size?: 'sm' | 'md' | 'lg';
  opacity?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  opacity = 'opacity-100'
}) => {
  // Determine size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  
  // Get initials from username
  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} ${user.avatarColor} ${opacity} rounded-full flex items-center justify-center text-white font-medium select-none`}
    >
      {getInitials(user.username)}
    </div>
  );
};

export default UserAvatar;