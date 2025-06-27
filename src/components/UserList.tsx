import React from 'react';
import { Search, Users as UsersIcon } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import UserAvatar from './UserAvatar';

interface UserListProps {
  isMobile?: boolean;
}

const UserList: React.FC<UserListProps> = ({ isMobile = false }) => {
  const { users, typingUsers } = useChat();
  const onlineUsers = users.filter(user => user.isOnline);
  const offlineUsers = users.filter(user => !user.isOnline);
  
  return (
    <div className={`flex flex-col h-full ${isMobile ? 'max-h-64' : ''}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search users..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <Search className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={18} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No users yet</p>
          </div>
        ) : (
          <>
            {onlineUsers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Online — {onlineUsers.length}
                </h3>
                <div className="space-y-2">
                  {onlineUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                      <UserAvatar user={user} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                          {(typingUsers || []).includes(user.username) && (
                            <span className="ml-2 text-xs text-indigo-500 animate-pulse">typing...</span>
                          )}
                        </p>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {offlineUsers.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Offline — {offlineUsers.length}
                </h3>
                <div className="space-y-2">
                  {offlineUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                      <UserAvatar user={user} opacity="opacity-60" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Offline
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserList;