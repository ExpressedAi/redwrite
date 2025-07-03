import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase, MediaContext } from '../../lib/supabase';

const FileSizeChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFileSizeData();
  }, []);

  const fetchFileSizeData = async () => {
    try {
      setLoading(true);
      const { data: mediaData, error } = await supabase
        .from('media_contexts')
        .select('size, type');
      
      if (error) {
        console.error('Error fetching file size data:', error);
        return;
      }
      
      // Categorize by file size ranges
      const sizeRanges = {
        'Small (< 1MB)': 0,
        'Medium (1-10MB)': 0,
        'Large (10-100MB)': 0,
        'Very Large (> 100MB)': 0
      };
      
      (mediaData || []).forEach((item: MediaContext) => {
        const sizeMB = item.size / (1024 * 1024);
        
        if (sizeMB < 1) {
          sizeRanges['Small (< 1MB)']++;
        } else if (sizeMB < 10) {
          sizeRanges['Medium (1-10MB)']++;
        } else if (sizeMB < 100) {
          sizeRanges['Large (10-100MB)']++;
        } else {
          sizeRanges['Very Large (> 100MB)']++;
        }
      });
      
      const chartData = Object.entries(sizeRanges).map(([range, count]) => ({
        range,
        count,
        percentage: ((count / (mediaData?.length || 1)) * 100).toFixed(1)
      }));
      
      setData(chartData);
    } catch (error) {
      console.error('Error fetching file size data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
          <p className="text-white font-medium">{label}</p>
          <p className="text-green-400">{data.count} files ({data.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-semibold text-white mb-4">File Size Distribution</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading chart data...</div>
        </div>
      </motion.div>
    );
  }

  if (data.every(item => item.count === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-semibold text-white mb-4">File Size Distribution</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">No files to analyze</div>
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
      <h3 className="text-xl font-semibold text-white mb-4">File Size Distribution</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="range" 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default FileSizeChart;