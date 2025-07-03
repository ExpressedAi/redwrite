import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase, MediaContext } from '../../lib/supabase';

const TagCloudChart: React.FC = () => {
  const [tags, setTags] = useState<{ text: string; count: number; size: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTagData();
  }, []);

  const fetchTagData = async () => {
    try {
      setLoading(true);
      const { data: mediaData, error } = await supabase
        .from('media_contexts')
        .select('gemini_suggested_tags');
      
      if (error) {
        console.error('Error fetching tag data:', error);
        return;
      }
      
      // Extract and count tags
      const tagCounts: { [key: string]: number } = {};
      
      (mediaData || []).forEach((item: MediaContext) => {
        if (item.gemini_suggested_tags) {
          const itemTags = item.gemini_suggested_tags
            .split(/[,;|\n]/)
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 2);
          
          itemTags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      // Convert to array and sort by frequency
      const tagArray = Object.entries(tagCounts)
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20 tags
      
      // Calculate sizes based on frequency
      const maxCount = Math.max(...tagArray.map(tag => tag.count));
      const tagsWithSizes = tagArray.map(tag => ({
        ...tag,
        size: Math.max(12, Math.min(32, (tag.count / maxCount) * 24 + 12))
      }));
      
      setTags(tagsWithSizes);
    } catch (error) {
      console.error('Error fetching tag data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Popular Tags</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading tag data...</div>
        </div>
      </motion.div>
    );
  }

  if (tags.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Popular Tags</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">No tags found. Upload and analyze some media files!</div>
        </div>
      </motion.div>
    );
  }

  const colors = [
    'text-indigo-400', 'text-green-400', 'text-yellow-400', 'text-red-400', 
    'text-purple-400', 'text-pink-400', 'text-blue-400', 'text-orange-400'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <h3 className="text-xl font-semibold text-white mb-4">Popular Tags</h3>
      <div className="h-80 overflow-hidden">
        <div className="flex flex-wrap items-center justify-center gap-3 h-full content-center">
          {tags.map((tag, index) => (
            <motion.span
              key={tag.text}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`font-medium cursor-pointer hover:scale-110 transition-transform ${
                colors[index % colors.length]
              }`}
              style={{ fontSize: `${tag.size}px` }}
              title={`Used ${tag.count} time${tag.count > 1 ? 's' : ''}`}
            >
              {tag.text}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TagCloudChart;