import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MediaUpload from '../components/MediaUpload';
import MediaGrid from '../components/MediaGrid';
import MediaFilters from '../components/MediaFilters';
import MediaDetailModal from '../components/MediaDetailModal';
import { MediaContext } from '../lib/supabase';

const MediaLibrary: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaContext | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMediaUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
          <p className="text-gray-400">
            Manage your documents, images, and videos processed by Gemini AI
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setUploadModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Upload Media
        </motion.button>
      </motion.div>

      <MediaFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <MediaGrid filter={activeFilter} onItemClick={setSelectedItem} refreshTrigger={refreshTrigger} />
      
      {uploadModalOpen && (
        <MediaUpload onClose={() => {
          setUploadModalOpen(false);
          handleMediaUpdate();
        }} />
      )}
      
      {selectedItem && (
        <MediaDetailModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)}
          onUpdate={handleMediaUpdate}
        />
      )}
    </div>
  );
};

export default MediaLibrary;