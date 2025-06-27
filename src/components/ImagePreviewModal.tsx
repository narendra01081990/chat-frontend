import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  fileName?: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageUrl,
  fileName,
  onClose
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              >
                <X size={24} />
              </button>

              {/* Download button */}
              <button
                onClick={handleDownload}
                className="absolute top-4 left-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                title="Download image"
              >
                <Download size={24} />
              </button>

              {/* Image */}
              <img
                src={imageUrl}
                alt={fileName || 'Preview'}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              />

              {/* File name */}
              {fileName && (
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-lg text-center">
                  {fileName}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ImagePreviewModal; 