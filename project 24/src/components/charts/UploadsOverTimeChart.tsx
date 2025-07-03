import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase, MediaContext } from '../../lib/supabase';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const UploadsOverTimeChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUploadsData();
  }, []);

  const fetchUploadsData = async () => {
    try {
      setLoading(true);
      const { data: mediaData, error } = await supabase
        .from('media_contexts')
        .select('created_at')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching uploads data:', error);
        return;
      }
      
      // Create data for last 30 days
      const endDate = new Date();
      const startDate = subDays(endDate, 29);
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Initialize all dates with 0 uploads
      const uploadsMap: { [key: string]: number } = {};
      dateRange.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        uploadsMap[dateKey] = 0;
      });
      
      // Count actual uploads by date
      (mediaData || []).forEach((item: MediaContext) => {
        const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
        if (uploadsMap.hasOwnProperty(dateKey)) {
          uploadsMap[dateKey]++;
        }
      });
      
      // Convert to chart format
      const chartData = dateRange.map(date => ({
        date: format(date, 'MMM dd'),
        uploads: uploadsMap[format(date, 'yyyy-MM-dd')],
        fullDate: format(date, 'yyyy-MM-dd')
      }));
      
      setData(chartData);
    } catch (error) {
      console.error('Error fetching uploads data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
          <p className="text-white font-medium">{label}</p>
          <p className="text-indigo-400">{payload[0].value} uploads</p>
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
        <h3 className="text-xl font-semibold text-white mb-4">Uploads Over Time (Last 30 Days)</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading chart data...</div>
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
      <h3 className="text-xl font-semibold text-white mb-4">Uploads Over Time (Last 30 Days)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="uploads"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default UploadsOverTimeChart;