import React, { useState } from 'react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  Target, 
  Download, 
  Globe,
  Upload, 
  Save,
  Trash2,
  Plus,
  Search,
  Filter,
  BarChart3
} from 'lucide-react';
import SemanticAnalyzer from '../components/context/SemanticAnalyzer';
import ContextTemplates from '../components/context/ContextTemplates';
import ContextExporter from '../components/context/ContextExporter';

const ContextManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'templates' | 'export'>('analyze');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const tabParam = searchParams.get('tab');
    if (tabParam && ['analyze', 'templates', 'export'].includes(tabParam)) {
      setActiveTab(tabParam as 'analyze' | 'templates' | 'export');
    }
  }, [searchParams]);
  const tabs = [
    { id: 'analyze', name: 'Semantic Analysis', icon: Brain },
    { id: 'templates', name: 'Context Templates', icon: Target },
    { id: 'export', name: 'Export & Profiles', icon: Download },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Context Management</h1>
        <p className="text-gray-400 mb-8">
          Analyze, optimize, and manage your conversation contexts with semantic intelligence
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex space-x-1 bg-gray-800 p-1 rounded-xl border border-gray-700"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'analyze' && <SemanticAnalyzer />}
        {activeTab === 'templates' && <ContextTemplates />}
        {activeTab === 'export' && <ContextExporter />}
      </motion.div>
    </div>
  );
};

export default ContextManagement;