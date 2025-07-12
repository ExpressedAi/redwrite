import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, Video, ExternalLink, Tag } from 'lucide-react';
import { getDB } from '../lib/indexedDB';
import { MediaContext } from '../lib/types';

interface MediaGridProps {
  filter: string;
  onItemClick?: (item: MediaContext) => void;
  refreshTrigger?: number;
}

const MediaGrid: React.FC<MediaGridProps> = ({ filter, onItemClick, refreshTrigger }) => {
  const [mediaItems, setMediaItems] = useState<MediaContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMediaItems();
  }, [refreshTrigger]);

  const fetchMediaItems = async () => {
    try {
      setLoading(true);
      const db = await getDB();
      const data = await db.getAllFromIndex('media', 'by-created_at');
      data.reverse(); // To get descending order
      
      setMediaItems(data || []);
    } catch (error) {
      console.error('Error fetching media items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf') || type.includes('text')) {
      return FileText;
    } else if (type.startsWith('image/')) {
      return Image;
    } else if (type.startsWith('video/')) {
      return Video;
    } else {
      return FileText;
    }
  };

  const getTypeCategory = (mimeType: string) => {
    if (mimeType.includes('pdf') || mimeType.includes('text')) {
      return 'document';
    } else if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else {
      return 'document';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const parseTags = (tagsString?: string) => {
    if (!tagsString) return [];
    // Simple parsing - split by common delimiters
    return tagsString.split(/[,;|\n]/).map(tag => tag.trim()).filter(tag => tag.length > 0).slice(0, 3);
  };

  const getAllTags = (item: MediaContext) => {
    const aiTags = parseTags(item.gemini_suggested_tags);
    const userTags = parseTags(item.user_tags);
    return [...userTags, ...aiTags].slice(0, 4); // Show max 4 tags
  };

  const filteredItems = filter === 'all' ? mediaItems : mediaItems.filter(item => {
    const category = getTypeCategory(item.type);
    switch (filter) {
      case 'documents':
        return category === 'document';
      case 'images':
        return category === 'image';
      case 'videos':
        return category === 'video';
      case 'tagged':
        return (item.gemini_suggested_tags && item.gemini_suggested_tags.length > 0) || 
               (item.user_tags && item.user_tags.length > 0);
      case 'recent':
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return new Date(item.created_at) > oneDayAgo;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading media items...</div>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">
          {filter === 'all' ? 'No media items found. Upload some files to get started!' : `No ${filter} items found.`}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredItems.map((item, index) => {
        const Icon = getIcon(item.type);
        const tags = getAllTags(item);
        
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500 transition-colors overflow-hidden cursor-pointer"
            onClick={() => onItemClick?.(item)}
          >
            {item.thumbnail_url ? (
              <div className="aspect-video overflow-hidden">
                <img
                  src={item.thumbnail_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-700 flex items-center justify-center">
                <Icon className="w-16 h-16 text-gray-500" />
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium truncate">{item.name}</h3>
                <button className="p-1 rounded text-gray-400 hover:text-white">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-3">
                {formatFileSize(item.size)} • {formatDate(item.created_at)}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${
                      parseTags(item.user_tags).includes(tag)
                        ? 'bg-blue-600 bg-opacity-20 text-blue-400'
                        : 'bg-indigo-600 bg-opacity-20 text-indigo-400'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
              
              <p className="text-gray-400 text-sm line-clamp-2">
                {item.gemini_summary || 'No summary available'}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MediaGrid;