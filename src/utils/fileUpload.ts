import { config, getBackendUrl } from '../config';

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: string;
  filename?: string;
}

export const MAX_FILE_SIZE = config.maxFileSize;
export const ALLOWED_IMAGE_TYPES = config.allowedImageTypes;
export const ALLOWED_FILE_TYPES = config.allowedFileTypes;

export const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 10MB';
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'File type not supported';
  }
  
  return null;
};

export const uploadFiles = async (files: File[]): Promise<FileData[]> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const backendUrl = getBackendUrl();

  try {
    console.log('Uploading files to:', backendUrl);
    
    const response = await fetch(`${backendUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload response error:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Upload result:', result);
    
    if (result.success) {
      return result.files;
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check your connection.');
    }
    
    throw error;
  }
};

export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      // For non-image files, create a placeholder
      resolve('');
    }
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType === 'text/plain') return '📝';
  if (fileType.includes('word')) return '📄';
  if (fileType.includes('excel')) return '📊';
  return '📎';
}; 