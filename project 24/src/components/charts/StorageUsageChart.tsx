import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer, Legend } from 'recharts';
import { supabase, MediaContext } from '../../lib/supabase';

const StorageUsageChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      const { data: mediaData, error } = await supabase
        .from('media_contexts')
        .select('size, type');
      
      if (error) {
        console.error('Error fetching storage data:', error);
        return;
      }
      
      // Calculate storage by type
      const storageByType: { [key: string]: number } = {
        'Images': 0,
        'Videos': 0,
        'Documents': 0,
        'Other': 0
      };
      
      let total = 0;
      
      (mediaData || []).forEach((item: MediaContext) => {
        total += item.size;
        
        if (item.type.startsWith('image/')) {
          storageByType['Images'] += item.size;
        } else if (item.type.startsWith('video/')) {
          storageByType['Videos'] += item.size;
        } else if (item.type.includes('pdf') || item.type.includes('text')) {
          storageByType['Documents'] += item.size;
        } else {
          storageByType['Other'] += item.size;
        }
      });
      
      setTotalSize(total);
      
      // Convert to chart format
      const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];
      const chartData = Object.entries(storageByType)
        .filter(([_, size]) => size > 0)
        .map(([name, size], index) => ({
          name,
          value: ((size / total) * 100).toFixed(1),
          size: formatFileSize(size),
          fill: colors[index % colors.length]
        }));
      
      setData(chartData);
    } catch (error) {
      console.error('Error fetching storage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Storage Usage</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading storage data...</div>
        </div>
      </motion.div>
    );
  }

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Storage Usage</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">No storage data available</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Storage Usage</h3>
        <div className="text-sm text-gray-400">
          Total: {formatFileSize(totalSize)}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
            <RadialBar
              minAngle={15}
              label={{ position: 'insideStart', fill: '#fff' }}
              background
              clockWise
              dataKey="value"
            />
            <Legend
              iconSize={10}
              layout="horizontal"
              verticalAlign="bottom"
              wrapperStyle={{
                color: '#9CA3AF',
                fontSize: '12px',
                paddingTop: '20px'
              }}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value}: {entry.payload.size} ({entry.payload.value}%)
                </span>
              )}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default StorageUsageChart;