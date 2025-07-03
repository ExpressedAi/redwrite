import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, Trash2, Edit3, Copy, Star } from 'lucide-react';

interface ContextTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  intensity: number;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
}

const ContextTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<ContextTemplate[]>([
    {
      id: '1',
      name: 'High-Energy Technical Discussion',
      description: 'For intense technical conversations requiring detailed explanations',
      content: 'I need you to provide an incredibly detailed, comprehensive analysis of this technical concept. Break down every component with precision and explain the underlying mechanisms with exceptional clarity.',
      intensity: 8.5,
      tags: ['technical', 'detailed', 'high-energy'],
      isFavorite: true,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Casual Brainstorming',
      description: 'For relaxed creative sessions and idea generation',
      content: 'Let\'s explore some ideas together. I\'m looking for creative suggestions and different perspectives on this topic. Feel free to think outside the box.',
      intensity: 4.2,
      tags: ['creative', 'casual', 'brainstorming'],
      isFavorite: false,
      createdAt: new Date('2024-01-10')
    },
    {
      id: '3',
      name: 'Problem-Solving Focus',
      description: 'For systematic problem analysis and solution development',
      content: 'I have a challenging problem that requires systematic analysis. Please help me break it down into components, identify root causes, and develop actionable solutions.',
      intensity: 7.1,
      tags: ['problem-solving', 'systematic', 'analytical'],
      isFavorite: true,
      createdAt: new Date('2024-01-08')
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContextTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    content: '',
    tags: ''
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return;

    const template: ContextTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      content: newTemplate.content,
      intensity: calculateIntensity(newTemplate.content),
      tags: newTemplate.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isFavorite: false,
      createdAt: new Date()
    };

    setTemplates([template, ...templates]);
    setNewTemplate({ name: '', description: '', content: '', tags: '' });
    setIsCreating(false);
  };

  const calculateIntensity = (content: string): number => {
    // Simple intensity calculation based on word analysis
    const words = content.toLowerCase().split(/\s+/);
    const highIntensityWords = ['incredible', 'amazing', 'exceptional', 'comprehensive', 'detailed', 'precision', 'challenging'];
    const matches = words.filter(word => highIntensityWords.some(intense => word.includes(intense)));
    return Math.min(10, 3 + (matches.length * 1.5));
  };

  const toggleFavorite = (id: string) => {
    setTemplates(templates.map(template => 
      template.id === id ? { ...template, isFavorite: !template.isFavorite } : template
    ));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(template => template.id !== id));
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return 'text-gray-400';
    if (intensity <= 5) return 'text-yellow-400';
    if (intensity <= 7) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Context Templates</h2>
          <p className="text-gray-400">Save and reuse optimized conversation contexts</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </motion.button>
      </div>

      {/* Create/Edit Template Modal */}
      {(isCreating || editingTemplate) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-700"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  placeholder="Brief description of when to use this template"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Enter the template content..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTemplate.tags}
                  onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  placeholder="technical, detailed, creative"
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateTemplate}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Template</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
                  setNewTemplate({ name: '', description: '', content: '', tags: '' });
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-indigo-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs text-gray-500">Intensity:</span>
                  <span className={`text-sm font-medium ${getIntensityColor(template.intensity)}`}>
                    {template.intensity.toFixed(1)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(template.id)}
                className={`p-1 rounded transition-colors ${
                  template.isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                }`}
              >
                <Star className={`w-4 h-4 ${template.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-300 line-clamp-3">{template.content}</p>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="bg-indigo-600 bg-opacity-20 text-indigo-400 px-2 py-1 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {template.createdAt.toLocaleDateString()}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(template.content)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Edit template"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ContextTemplates;