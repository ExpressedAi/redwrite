import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, Search, Download } from 'lucide-react';

const QuickActions: React.FC = () => {
  const actions = [
    { name: 'New Context', icon: Plus, color: 'bg-indigo-600 hover:bg-indigo-700' },
    { name: 'Upload Media', icon: Upload, color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Search Data', icon: Search, color: 'bg-yellow-600 hover:bg-yellow-700' },
    { name: 'Export', icon: Download, color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${action.color}`}
          >
            <action.icon className="w-5 h-5 text-white" />
            <span className="text-white font-medium">{action.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickActions;