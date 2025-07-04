// Configuration for the chat application
export const config = {
  // Backend URL - use environment variable or default to local IP for mobile testing
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://192.168.1.3:5000',
  
  // Socket URL - use environment variable or default to local IP for mobile testing
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://192.168.1.3:5000',
  
  // File upload settings
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  
  // Allowed file types
  allowedFileTypes: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  
  // Allowed image types
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
};

// Helper function to get the correct backend URL based on environment
export const getBackendUrl = () => {
  if (import.meta.env.DEV) {
    // In development, try to use the configured URL or default to local IP
    return config.backendUrl;
  }
  // In production, use the Render backend URL
  return 'https://chat-backend-lfwv.onrender.com';
};

// Helper function to get the correct socket URL
export const getSocketUrl = () => {
  if (import.meta.env.DEV) {
    return config.socketUrl;
  }
  // In production, always use the Render backend URL
  return 'https://chat-backend-lfwv.onrender.com';
};