import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, Video, Tag, Calendar } from 'lucide-react';

interface MediaFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const MediaFilters: React.FC<MediaFiltersProps> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', name: 'All Media', icon: FileText },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'images', name: 'Images', icon: Image },
    { id: 'videos', name: 'Videos', icon: Video },
    { id: 'tagged', name: 'Tagged', icon: Tag },
    { id: 'recent', name: 'Recent', icon: Calendar },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <motion.button
          key={filter.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFilterChange(filter.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeFilter === filter.id
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <filter.icon className="w-4 h-4" />
          <span>{filter.name}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default MediaFilters;