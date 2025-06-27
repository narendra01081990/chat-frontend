import React, { useState, useRef } from 'react';
import { Paperclip, X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { FileData, validateFile, uploadFiles, formatFileSize, getFileIcon } from '../utils/fileUpload';
import ImagePreviewModal from './ImagePreviewModal';

interface FileAttachmentProps {
  onFileSelect: (files: FileData[]) => void;
  selectedFiles: FileData[];
}

const FileAttachment: React.FC<FileAttachmentProps> = ({ onFileSelect, selectedFiles }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    console.log('Files selected:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Validate files first
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          setUploadError(error);
          return;
        }
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload files to server
      console.log('Starting file upload...');
      const uploadedFiles = await uploadFiles(files);
      console.log('Files uploaded successfully:', uploadedFiles);
      
      // Complete progress
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      
      // Add uploaded files to selected files
      onFileSelect([...selectedFiles, ...uploadedFiles]);
    } catch (error) {
      console.error('Upload error details:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = selectedFiles.filter(file => file.id !== fileId);
    onFileSelect(updatedFiles);
  };

  const openImageModal = (file: FileData) => {
    if (file.type.startsWith('image/')) {
      setSelectedImage({ url: file.url, name: file.name });
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative"
          title="Attach file"
        >
          {isUploading ? (
            <Upload size={20} className="animate-pulse" />
          ) : (
            <Paperclip size={20} />
          )}
          
          {/* Upload progress indicator */}
          {isUploading && uploadProgress > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4">
              <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${uploadProgress}, 100`}
                  className="text-blue-500"
                />
              </svg>
            </div>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-400">{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload success indicator */}
      {uploadProgress === 100 && (
        <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2">
          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-400">Files uploaded successfully!</span>
        </div>
      )}

      {/* File previews */}
      {selectedFiles.length > 0 && (
        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
          {selectedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              {file.type.startsWith('image/') ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openImageModal(file)}
                    onError={(e) => {
                      console.error('Image load error:', file.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 w-full">
                  <span className="text-2xl flex-shrink-0">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ImagePreviewModal
        isOpen={isModalOpen}
        imageUrl={selectedImage?.url || ''}
        fileName={selectedImage?.name}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedImage(null);
        }}
      />
    </>
  );
};

export default FileAttachment; 