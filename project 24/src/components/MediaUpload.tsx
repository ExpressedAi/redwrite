import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileText, Image, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { 
  isTextFile, 
  chunkText, 
  parseGeminiAnalysis, 
  processChunkWithGemini, 
  analyzeTextWithGeminiChunking,
  analyzeMediaWithGemini 
} from '../utils/aiAnalysis';

interface MediaUploadProps {
  onClose: () => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ onClose }) => {
  const { geminiApiKey, autoAnalysis, maxFileSize } = useSettings();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter files by size
    const validFiles = acceptedFiles.filter(file => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        toast.error(`${file.name} is too large. Maximum size is ${maxFileSize}MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      
      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');
      reader.onload = () => {
        if (autoAnalysis && geminiApiKey) {
          // Check if it's a text file for chunked analysis
          if (isTextFile(file)) {
            processTextFileWithChunking(file, geminiApiKey);
          } else {
            // Process non-text files normally
            processWithGemini(file, geminiApiKey);
          }
        } else {
          // Save without analysis
          saveWithoutAnalysis(file);
        }
      };
      
      reader.readAsDataURL(file);
    });
  }, [autoAnalysis, geminiApiKey, maxFileSize]);

  const processTextFileWithChunking = async (file: File, geminiApiKey: string) => {
    try {
      toast.success(`Processing ${file.name} with chunked analysis...`);
      
      // First, save the basic file info to get the media_context_id
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const fileContent = reader.result as string;
          
          // Save basic file info first
          const { data: mediaData, error: mediaError } = await supabase
            .from('media_contexts')
            .insert([
              {
                name: file.name,
                type: file.type,
                size: file.size,
                file_url: fileContent
              }
            ])
            .select()
            .single();
          
          if (mediaError) {
            throw mediaError;
          }
          
          // Extract text content for chunking
          let textContent = '';
          if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            textContent = fileContent;
          } else {
            // For other text-based formats, use the content as-is
            textContent = fileContent;
          }
          
          // Remove data URL prefix if present
          if (textContent.startsWith('data:')) {
            const base64Index = textContent.indexOf(',');
            if (base64Index !== -1) {
              try {
                textContent = atob(textContent.slice(base64Index + 1));
              } catch (e) {
                // If base64 decode fails, use original content
                console.warn('Failed to decode base64 content, using original');
              }
            }
          }
          
          // Split into chunks
          const chunks = chunkText(textContent);
          
          toast.success(`Analyzing ${chunks.length} chunks for ${file.name}...`);
          
          // Process each chunk with Gemini
          for (let i = 0; i < chunks.length; i++) {
            await processChunkWithGemini(mediaData.id, i, chunks[i], file.name, geminiApiKey);
            
            // Add a small delay between requests to avoid rate limiting
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          toast.success(`${file.name} processed successfully with ${chunks.length} chunks!`);
          
        } catch (error) {
          console.error('Text processing error:', error);
          toast.error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Processing Error:', error);
      toast.error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const saveWithoutAnalysis = async (file: File) => {
    try {
      toast.success(`Uploading ${file.name}...`);
      
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          
          // Generate thumbnail URL for images
          let thumbnailUrl = null;
          if (file.type.startsWith('image/')) {
            thumbnailUrl = result;
          }
          
          const { data, error } = await supabase
            .from('media_contexts')
            .insert([
              {
                name: file.name,
                type: file.type,
                size: file.size,
                thumbnail_url: thumbnailUrl,
                file_url: result
              }
            ])
            .select();
          
          if (error) {
            throw error;
          }
          
          toast.success(`${file.name} uploaded successfully!`);
        } catch (error) {
          console.error('Upload Error:', error);
          toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Processing Error:', error);
      toast.error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const processWithGemini = async (file: File, geminiApiKey: string) => {
    if (!geminiApiKey) {
      toast.error('Gemini API key not configured. Please set it in Settings.');
      return;
    }

    try {
      toast.success(`Processing ${file.name} with Gemini AI...`);
      
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          await analyzeMediaWithGemini(file, result, geminiApiKey);
          toast.success(`${file.name} processed and saved successfully!`);
          
        } catch (apiError) {
          console.error('Gemini API Error:', apiError);
          toast.error(`Failed to process ${file.name}: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
        }
      };
      
      reader.onerror = () => {
        toast.error(`Failed to read ${file.name}`);
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Processing Error:', error);
      toast.error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'text/*': ['.txt', '.md'],
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upload Media</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragActive
              ? 'border-indigo-400 bg-indigo-400 bg-opacity-10'
              : 'border-gray-700 hover:border-indigo-400 bg-gray-800'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-indigo-400 text-lg">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-white text-lg mb-2">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-gray-400 text-sm">
                Supports PDF, images, videos, and text files (max {maxFileSize}MB each)
              </p>
              {!autoAnalysis && (
                <p className="text-yellow-400 text-xs mt-2">
                  Auto-analysis is disabled. Files will be uploaded without AI processing.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-white font-medium mb-4">Supported Formats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <FileText className="w-5 h-5" />
              <span>PDF, TXT, MD</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Image className="w-5 h-5" />
              <span>JPG, PNG, GIF</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Video className="w-5 h-5" />
              <span>MP4, AVI, MOV</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MediaUpload;