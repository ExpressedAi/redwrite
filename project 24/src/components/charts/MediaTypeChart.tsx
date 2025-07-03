import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase, MediaContext } from '../../lib/supabase';

const MediaTypeChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    fetchMediaTypeData();
  }, []);

  const fetchMediaTypeData = async () => {
    try {
      setLoading(true);
      const { data: mediaData, error } = await supabase
        .from('media_contexts')
        .select('type');
      
      if (error) {
        console.error('Error fetching media type data:', error);
        return;
      }
      
      // Categorize media types
      const typeCounts: { [key: string]: number } = {};
      
      (mediaData || []).forEach((item: MediaContext) => {
        let category = 'Other';
        
        if (item.type.startsWith('image/')) {
          category = 'Images';
        } else if (item.type.startsWith('video/')) {
          category = 'Videos';
        } else if (item.type.includes('pdf')) {
          category = 'PDFs';
        } else if (item.type.includes('text')) {
          category = 'Text Files';
        }
        
        typeCounts[category] = (typeCounts[category] || 0) + 1;
      });
      
      const chartData = Object.entries(typeCounts).map(([name, value]) => ({
        name,
        value,
        percentage: ((value / (mediaData?.length || 1)) * 100).toFixed(1)
      }));
      
      setData(chartData);
    } catch (error) {
      console.error('Error fetching media type data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-indigo-400">{data.value} files ({data.percentage}%)</p>
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
        <h3 className="text-xl font-semibold text-white mb-4">Media Types Distribution</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading chart data...</div>
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
        <h3 className="text-xl font-semibold text-white mb-4">Media Types Distribution</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">No media files to display</div>
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
      <h3 className="text-xl font-semibold text-white mb-4">Media Types Distribution</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} (${percentage}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default MediaTypeChart;