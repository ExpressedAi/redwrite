import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  Download, 
  Upload, 
  Trash2, 
  Moon, 
  Sun, 
  Shield, 
  Database,
  FileText,
  Settings as SettingsIcon,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const {
    geminiApiKey,
    setGeminiApiKey,
    openaiApiKey,
    setOpenaiApiKey,
    theme,
    setTheme,
    autoAnalysis,
    setAutoAnalysis,
    maxFileSize,
    setMaxFileSize,
  } = useSettings();

  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(geminiApiKey);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [tempOpenAIKey, setTempOpenAIKey] = useState(openaiApiKey);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveApiKey = () => {
    setGeminiApiKey(tempApiKey);
    toast.success('API key saved successfully!');
  };

  const handleSaveOpenAIKey = () => {
    setOpenaiApiKey(tempOpenAIKey);
    toast.success('OpenAI API key saved successfully!');
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase
        .from('media_contexts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const exportData = {
        exported_at: new Date().toISOString(),
        total_items: data?.length || 0,
        media_contexts: data || []
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contextflow-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL media data? This action cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);
      const { error } = await supabase
        .from('media_contexts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        throw error;
      }

      toast.success('All data cleared successfully!');
    } catch (error) {
      console.error('Clear data error:', error);
      toast.error('Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        if (!importData.media_contexts || !Array.isArray(importData.media_contexts)) {
          throw new Error('Invalid import file format');
        }

        const { error } = await supabase
          .from('media_contexts')
          .insert(importData.media_contexts);

        if (error) {
          throw error;
        }

        toast.success(`Imported ${importData.media_contexts.length} items successfully!`);
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400 mb-8">
          Configure your Redwrite database and preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Key className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">API Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 pr-20"
                  placeholder="Enter your Gemini API key"
                />
                <div className="absolute right-2 top-2 flex space-x-1">
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Required for AI analysis of uploaded media files
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenAIKey ? 'text' : 'password'}
                  value={tempOpenAIKey}
                  onChange={(e) => setTempOpenAIKey(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 pr-20"
                  placeholder="Enter your OpenAI API key"
                />
                <div className="absolute right-2 top-2 flex space-x-1">
                  <button
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Required for DALL-E 3 thumbnail generation
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveApiKey}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save API Key</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveOpenAIKey}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save OpenAI Key</span>
            </motion.button>
          </div>
        </motion.div>

        {/* General Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">General Preferences</h2>
          </div>

          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-400" />
                )}
                <div>
                  <p className="text-white font-medium">Theme</p>
                  <p className="text-sm text-gray-400">Choose your preferred theme</p>
                </div>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Analysis */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Auto Analysis</p>
                  <p className="text-sm text-gray-400">Automatically analyze uploaded files</p>
                </div>
              </div>
              <button
                onClick={() => setAutoAnalysis(!autoAnalysis)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoAnalysis ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoAnalysis ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Max File Size */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum File Size (MB)
              </label>
              <input
                type="number"
                value={maxFileSize}
                onChange={(e) => setMaxFileSize(parseInt(e.target.value) || 50)}
                min="1"
                max="500"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum size for uploaded files
              </p>
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Data Management</h2>
          </div>

          <div className="space-y-4">
            {/* Export Data */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export All Data'}</span>
            </motion.button>

            {/* Import Data */}
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="import-file"
              />
              <motion.label
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                htmlFor="import-file"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
              </motion.label>
            </div>

            {/* Clear All Data */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearAllData}
              disabled={isClearing}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isClearing ? 'Clearing...' : 'Clear All Data'}</span>
            </motion.button>
          </div>

          <div className="mt-4 p-3 bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <p className="text-sm text-yellow-300">
                Data operations are permanent. Export your data before clearing.
              </p>
            </div>
          </div>
        </motion.div>

        {/* System Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">System Information</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Version</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Database</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">AI Service</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white">Gemini API</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Storage</span>
              <span className="text-white">Supabase</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;