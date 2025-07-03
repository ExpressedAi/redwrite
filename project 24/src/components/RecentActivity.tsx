import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Upload, Tag, Link2 } from 'lucide-react';
import { supabase, MediaContext } from '../lib/supabase';

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_contexts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) {
        console.error('Error fetching recent activity:', error);
        return;
      }
      
      const recentActivities = (data || []).map((item: MediaContext, index: number) => ({
        id: item.id,
        type: 'upload',
        message: `${item.name} uploaded and processed`,
        timestamp: new Date(item.created_at),
        icon: Upload,
        color: 'text-green-400',
      }));
      
      setActivities(recentActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
        <div className="text-gray-400 text-center py-8">Loading recent activity...</div>
      </motion.div>
    );
  }

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
        <div className="text-gray-400 text-center py-8">No recent activity. Upload some media to get started!</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-gray-700 ${activity.color}`}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{activity.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentActivity;