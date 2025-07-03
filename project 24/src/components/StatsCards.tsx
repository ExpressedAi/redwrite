import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Database, Image, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

const StatsCards: React.FC = () => {
  const [stats, setStats] = useState([
    {
      name: 'Total Conversations',
      value: '12,847',
      change: '+12%',
      changeType: 'positive',
      icon: MessageSquare,
    },
    {
      name: 'Context Entries',
      value: '0',
      change: '0%',
      changeType: 'positive',
      icon: Database,
    },
    {
      name: 'Media Files',
      value: '0',
      change: '0%',
      changeType: 'positive',
      icon: Image,
    },
    {
      name: 'Avg. Response Time',
      value: '0.8s',
      change: '-5%',
      changeType: 'positive',
      icon: TrendingUp,
    },
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count, error } = await supabase
        .from('media_contexts')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }
      
      const mediaCount = count || 0;
      
      setStats(prevStats => prevStats.map(stat => {
        if (stat.name === 'Context Entries' || stat.name === 'Media Files') {
          return {
            ...stat,
            value: mediaCount.toLocaleString(),
            change: mediaCount > 0 ? '+100%' : '0%'
          };
        }
        return stat;
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-indigo-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <stat.icon className="w-8 h-8 text-indigo-400 mb-4" />
              <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
            <div className={`text-sm font-medium ${
              stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
            }`}>
              {stat.change}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;