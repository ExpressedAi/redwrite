import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, FileText, Image, Video, Tag, Calendar, HardDrive, ChevronDown, ChevronRight, 
  Zap, Edit3, Save, Plus, Trash2, Sparkles, Loader, Check, AlertCircle 
} from 'lucide-react';
import { MediaContext, MediaAnalysisChunk, supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { generateImageWithDalle, generatePromptForMedia } from '../utils/openaiApi';
import toast from 'react-hot-toast';

interface MediaDetailModalProps {
  item: MediaContext;
  onClose: () => void;
  onUpdate?: () => void;
}

const MediaDetailModal: React.FC<MediaDetailModalProps> = ({ item, onClose, onUpdate }) => {
  const [chunks, setChunks] = useState<MediaAnalysisChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [userTags, setUserTags] = useState(item.user_tags || '');
  const [newTag, setNewTag] = useState('');
  const [isGeneratingAITags, setIsGeneratingAITags] = useState(false);
  const { openaiApiKey, geminiApiKey } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalysisChunks();
  }, [item.id]);

  const fetchAnalysisChunks = async () => {
    try {
      setLoadingChunks(true);
      const { data, error } = await supabase
        .from('media_analysis_chunks')
        .select('*')
        .eq('media_context_id', item.id)
        .order('chunk_index', { ascending: true });
      
      if (error) {
        console.error('Error fetching analysis chunks:', error);
        return;
      }
      
      setChunks(data || []);
    } catch (error) {
      console.error('Error fetching analysis chunks:', error);
    } finally {
      setLoadingChunks(false);
    }
  };

  const toggleChunkExpansion = (chunkIndex: number) => {
    const newExpanded = new Set(expandedChunks);
    if (newExpanded.has(chunkIndex)) {
      newExpanded.delete(chunkIndex);
    } else {
      newExpanded.add(chunkIndex);
    }
    setExpandedChunks(newExpanded);
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf') || type.includes('text')) {
      return FileText;
    } else if (type.startsWith('image/')) {
      return Image;
    } else if (type.startsWith('video/')) {
      return Video;
    } else {
      return FileText;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleAnalyzeSemantics = () => {
    // Get the content to analyze - prioritize chunks if available, otherwise use main content
    let contentToAnalyze = '';
    
    if (chunks.length > 0) {
      // Use the first few chunks' content
      contentToAnalyze = chunks.slice(0, 3).map(chunk => chunk.chunk_content || chunk.summary || '').join('\n\n');
    } else {
      // Use main analysis content
      contentToAnalyze = [
        item.gemini_summary,
        item.gemini_key_insights,
        item.gemini_notable_features
      ].filter(Boolean).join('\n\n');
    }
    
    if (!contentToAnalyze.trim()) {
      contentToAnalyze = `Analyze the content of this ${item.type} file named "${item.name}". This file is ${formatFileSize(item.size)} in size.`;
    }
    
    // Store the content in sessionStorage to pass to the semantic analyzer
    sessionStorage.setItem('semanticAnalysisContent', contentToAnalyze);
    sessionStorage.setItem('semanticAnalysisSource', item.name);
    
    // Navigate to context management page with analyze tab
    navigate('/context?tab=analyze');
    onClose();
  };

  const handleSaveName = async () => {
    try {
      const { error } = await supabase
        .from('media_contexts')
        .update({ name: editedName })
        .eq('id', item.id);
      
      if (error) throw error;
      
      toast.success('File name updated successfully!');
      setIsEditingName(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update file name');
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!openaiApiKey) {
      toast.error('OpenAI API key not configured. Please set it in Settings.');
      return;
    }

    try {
      setIsGeneratingThumbnail(true);
      toast.success('Generating AI thumbnail...');
      
      // Create prompt based on file content
      const prompt = generatePromptForMedia(
        item.name,
        item.gemini_summary,
        item.gemini_key_insights,
        item.gemini_suggested_tags || item.user_tags
      );
      
      // Generate image with DALL-E 3
      const imageUrl = await generateImageWithDalle(prompt, openaiApiKey);
      
      // Update the thumbnail_url in database
      const { error } = await supabase
        .from('media_contexts')
        .update({ thumbnail_url: imageUrl })
        .eq('id', item.id);
      
      if (error) throw error;
      
      // Update local state
      item.thumbnail_url = imageUrl;
      
      toast.success('AI thumbnail generated successfully!');
      onUpdate?.();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast.error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleSaveTags = async () => {
    try {
      const { error } = await supabase
        .from('media_contexts')
        .update({ user_tags: userTags })
        .eq('id', item.id);
      
      if (error) throw error;
      
      toast.success('Tags updated successfully!');
      setIsEditingTags(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating tags:', error);
      toast.error('Failed to update tags');
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const currentTags = userTags ? userTags.split(',').map(tag => tag.trim()) : [];
    if (!currentTags.includes(newTag.trim())) {
      const updatedTags = [...currentTags, newTag.trim()].join(', ');
      setUserTags(updatedTags);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = userTags.split(',').map(tag => tag.trim());
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove).join(', ');
    setUserTags(updatedTags);
  };

  const handleGenerateAITags = async () => {
    if (!geminiApiKey) {
      toast.error('Gemini API key not configured. Please set it in Settings.');
      return;
    }

    try {
      setIsGeneratingAITags(true);
      toast.success('Generating AI tags...');
      
      // Create content for tag generation
      let contentForTags = '';
      if (chunks.length > 0) {
        contentForTags = chunks.slice(0, 3).map(chunk => 
          [chunk.summary, chunk.key_insights, chunk.notable_features].filter(Boolean).join(' ')
        ).join(' ');
      } else {
        contentForTags = [
          item.gemini_summary,
          item.gemini_key_insights,
          item.gemini_notable_features
        ].filter(Boolean).join(' ');
      }
      
      if (!contentForTags.trim()) {
        contentForTags = `Generate relevant tags for a ${item.type} file named "${item.name}"`;
      }
      
      const requestBody = {
        contents: [{
          parts: [{
            text: `Based on this content, generate 8-12 relevant, specific tags for categorization and search. Focus on topics, themes, concepts, and key subjects. Return only the tags separated by commas, no explanations:

Content: ${contentForTags.substring(0, 2000)}`
          }]
        }]
      };
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedTags = data.candidates[0].content.parts[0].text.trim();
        
        // Clean up the tags
        const cleanTags = generatedTags
          .split(/[,;|\n]/)
          .map(tag => tag.trim().replace(/^["\-\*\d\.\s]+|["\-\*\d\.\s]+$/g, ''))
          .filter(tag => tag.length > 2 && tag.length < 30)
          .slice(0, 12)
          .join(', ');
        
        // Merge with existing user tags
        const existingTags = userTags ? userTags.split(',').map(tag => tag.trim()) : [];
        const newTagsArray = cleanTags.split(',').map(tag => tag.trim());
        const allTags = [...new Set([...existingTags, ...newTagsArray])];
        
        setUserTags(allTags.join(', '));
        toast.success('AI tags generated successfully!');
      } else {
        throw new Error('Unexpected response format from Gemini API');
      }
      
    } catch (error) {
      console.error('Error generating AI tags:', error);
      toast.error(`Failed to generate AI tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingAITags(false);
    }
  };

  const parseTags = (tagsString?: string) => {
    if (!tagsString) return [];
    return tagsString.split(/[,;|\n]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  const Icon = getIcon(item.type);
  const tags = parseTags(item.gemini_suggested_tags);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 mr-4">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl font-bold bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white focus:outline-none focus:border-indigo-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 text-green-400 hover:text-green-300"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setEditedName(item.name);
                  }}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-white">{item.name}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Media Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Preview</h3>
            {item.thumbnail_url ? (
              <div className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={item.thumbnail_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-700 flex items-center justify-center rounded-lg">
                <Icon className="w-24 h-24 text-gray-500" />
              </div>
            )}
            
            {/* Generate Thumbnail Button - Only for non-image files */}
            {!item.type.startsWith('image/') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateThumbnail}
                disabled={isGeneratingThumbnail}
                className="w-full mt-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isGeneratingThumbnail ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Thumbnail</span>
                  </>
                )}
              </motion.button>
            )}

            {/* File Info */}
            <div className="bg-gray-700 rounded-lg p-4 space-y-3">
              <h4 className="text-white font-medium">File Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-300">
                  <HardDrive className="w-4 h-4" />
                  <span>Size: {formatFileSize(item.size)}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <FileText className="w-4 h-4" />
                  <span>Type: {item.type}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>Uploaded: {formatDate(item.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
            
            {loadingChunks ? (
              <div className="text-gray-400 text-center py-8">Loading analysis...</div>
            ) : chunks.length > 0 ? (
              /* Chunked Analysis */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Chunked Analysis ({chunks.length} parts)</h4>
                  <button
                    onClick={() => {
                      if (expandedChunks.size === chunks.length) {
                        setExpandedChunks(new Set());
                      } else {
                        setExpandedChunks(new Set(chunks.map((_, i) => i)));
                      }
                    }}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    {expandedChunks.size === chunks.length ? 'Collapse All' : 'Expand All'}
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {chunks.map((chunk, index) => (
                    <div key={chunk.id} className="bg-gray-700 rounded-lg">
                      <button
                        onClick={() => toggleChunkExpansion(index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-600 transition-colors rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {expandedChunks.has(index) ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-white font-medium">
                            Chunk {index + 1}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {chunk.summary ? chunk.summary.substring(0, 50) + '...' : 'No summary'}
                        </span>
                      </button>
                      
                      {expandedChunks.has(index) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4 pb-4 space-y-3"
                        >
                          {chunk.chunk_content && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-300 mb-1">Content Preview</h5>
                              <p className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                                {chunk.chunk_content}
                              </p>
                            </div>
                          )}
                          
                          {chunk.summary && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-300 mb-1">Summary</h5>
                              <p className="text-sm text-gray-300">{chunk.summary}</p>
                            </div>
                          )}
                          
                          {chunk.key_insights && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-300 mb-1">Key Insights</h5>
                              <p className="text-sm text-gray-300">{chunk.key_insights}</p>
                            </div>
                          )}
                          
                          {chunk.notable_features && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-300 mb-1">Notable Features</h5>
                              <p className="text-sm text-gray-300">{chunk.notable_features}</p>
                            </div>
                          )}
                          
                          {chunk.suggested_tags && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-300 mb-2">Tags</h5>
                              <div className="flex flex-wrap gap-1">
                                {chunk.suggested_tags.split(/[,;|\n]/).map((tag, tagIndex) => {
                                  const cleanTag = tag.trim();
                                  if (!cleanTag) return null;
                                  return (
                                    <span
                                      key={tagIndex}
                                      className="bg-indigo-600 bg-opacity-20 text-indigo-400 px-2 py-1 rounded text-xs"
                                    >
                                      {cleanTag}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Traditional Analysis (for non-chunked files) */
              <div className="space-y-4">
                {/* Summary */}
                {item.gemini_summary && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Summary</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{item.gemini_summary}</p>
                  </div>
                )}

                {/* Key Insights */}
                {item.gemini_key_insights && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Key Insights</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{item.gemini_key_insights}</p>
                  </div>
                )}

                {/* Notable Features */}
                {item.gemini_notable_features && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Notable Features</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{item.gemini_notable_features}</p>
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Suggested Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-indigo-600 bg-opacity-20 text-indigo-400 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Analysis Available */}
                {!item.gemini_summary && !item.gemini_key_insights && !item.gemini_notable_features && tags.length === 0 && (
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <p className="text-gray-400">No AI analysis available for this file.</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Enable auto-analysis in settings or re-upload the file.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* User Tags Section */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">Your Tags</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={handleGenerateAITags}
                    disabled={isGeneratingAITags}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-2 py-1 rounded flex items-center space-x-1"
                  >
                    {isGeneratingAITags ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>AI Tags</span>
                  </button>
                  <button
                    onClick={() => setIsEditingTags(!isEditingTags)}
                    className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded flex items-center space-x-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
              
              {isEditingTags ? (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-indigo-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <button
                      onClick={handleAddTag}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <textarea
                    value={userTags}
                    onChange={(e) => setUserTags(e.target.value)}
                    placeholder="Enter tags separated by commas..."
                    className="w-full h-20 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveTags}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingTags(false);
                        setUserTags(item.user_tags || '');
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userTags ? userTags.split(',').map((tag, index) => {
                    const cleanTag = tag.trim();
                    if (!cleanTag) return null;
                    return (
                      <span
                        key={index}
                        className="bg-blue-600 bg-opacity-20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center space-x-1 group"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{cleanTag}</span>
                        {isEditingTags && (
                          <button
                            onClick={() => handleRemoveTag(cleanTag)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  }) : (
                    <p className="text-gray-400 text-sm">No tags added yet. Click Edit to add tags.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyzeSemantics}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Analyze Semantics</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MediaDetailModal;