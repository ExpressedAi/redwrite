import React from 'react';
import { motion } from 'framer-motion';
import MediaTypeChart from '../components/charts/MediaTypeChart';
import UploadsOverTimeChart from '../components/charts/UploadsOverTimeChart';
import FileSizeChart from '../components/charts/FileSizeChart';
import TagCloudChart from '../components/charts/TagCloudChart';
import StorageUsageChart from '../components/charts/StorageUsageChart';
import ActivityHeatmapChart from '../components/charts/ActivityHeatmapChart';

const Analytics: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400 mb-8">
          Deep insights and analytics for your media library and content analysis
        </p>
      </motion.div>

      {/* First Row - Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MediaTypeChart />
        <UploadsOverTimeChart />
      </div>

      {/* Second Row - Size and Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FileSizeChart />
        <StorageUsageChart />
      </div>

      {/* Third Row - Tags and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TagCloudChart />
        <ActivityHeatmapChart />
      </div>
    </div>
  );
};

export default Analytics;