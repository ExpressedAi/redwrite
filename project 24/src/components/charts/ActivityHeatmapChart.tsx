import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase, MediaContext } from '../../lib/supabase';
import { format, eachDayOfInterval, subDays } from 'date-fns';

const ActivityHeatmapChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const { data: mediaData, error } = await supabase
        .from('media_contexts')
        .select('created_at');
      
      if (error) {
        console.error('Error fetching activity data:', error);
        return;
      }
      
      // Create heatmap for last 12 weeks (84 days)
      const endDate = new Date();
      const startDate = subDays(endDate, 83);
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Count uploads per day
      const activityMap: { [key: string]: number } = {};
      dateRange.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        activityMap[dateKey] = 0;
      });
      
      (mediaData || []).forEach((item: MediaContext) => {
        const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
        if (activityMap.hasOwnProperty(dateKey)) {
          activityMap[dateKey]++;
        }
      });
      
      // Convert to heatmap format (weeks x days)
      const weeks: any[] = [];
      const maxActivity = Math.max(...Object.values(activityMap));
      
      for (let week = 0; week < 12; week++) {
        const weekData = [];
        for (let day = 0; day < 7; day++) {
          const dateIndex = week * 7 + day;
          if (dateIndex < dateRange.length) {
            const date = dateRange[dateIndex];
            const dateKey = format(date, 'yyyy-MM-dd');
            const activity = activityMap[dateKey];
            const intensity = maxActivity > 0 ? activity / maxActivity : 0;
            
            weekData.push({
              date: dateKey,
              day: format(date, 'EEE'),
              activity,
              intensity,
              displayDate: format(date, 'MMM dd')
            });
          }
        }
        if (weekData.length > 0) {
          weeks.push(weekData);
        }
      }
      
      setData(weeks);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-700';
    if (intensity <= 0.25) return 'bg-green-900';
    if (intensity <= 0.5) return 'bg-green-700';
    if (intensity <= 0.75) return 'bg-green-500';
    return 'bg-green-400';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Activity Heatmap (Last 12 Weeks)</h3>
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading activity data...</div>
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
      <h3 className="text-xl font-semibold text-white mb-4">Activity Heatmap (Last 12 Weeks)</h3>
      <div className="h-80 overflow-auto">
        <div className="flex space-x-1">
          {/* Day labels */}
          <div className="flex flex-col space-y-1 mr-2">
            <div className="h-3"></div> {/* Spacer for week labels */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="h-3 text-xs text-gray-400 flex items-center">
                {day}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {data.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col space-y-1">
              {/* Week number */}
              <div className="h-3 text-xs text-gray-400 text-center">
                {weekIndex % 4 === 0 ? `W${weekIndex + 1}` : ''}
              </div>
              
              {/* Days in week */}
              {week.map((day: any, dayIndex: number) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${getIntensityColor(day.intensity)} cursor-pointer transition-all hover:scale-125`}
                  title={`${day.displayDate}: ${day.activity} upload${day.activity !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-700 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-900 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-700 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ActivityHeatmapChart;