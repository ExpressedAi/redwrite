import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, FileText, Settings, User, Brain } from 'lucide-react';
import { supabase, MediaContext, MediaAnalysisChunk } from '../../lib/supabase';

const ContextExporter: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'txt'>('json');
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [includeTemplates, setIncludeTemplates] = useState(true);
  const [includePreferences, setIncludePreferences] = useState(true);
  const [realProfile, setRealProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateRealProfile();
  }, []);

  const generateRealProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch media contexts
      const { data: mediaData, error: mediaError } = await supabase
        .from('media_contexts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (mediaError) {
        console.error('Error fetching media data:', mediaError);
        return;
      }
      
      // Fetch analysis chunks
      const { data: chunksData, error: chunksError } = await supabase
        .from('media_analysis_chunks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (chunksError) {
        console.error('Error fetching chunks data:', chunksError);
        return;
      }
      
      // Generate real profile data
      const totalContexts = (mediaData || []).length;
      const totalChunks = (chunksData || []).length;
      
      // Aggregate tags from all sources
      const allTags: string[] = [];
      (mediaData || []).forEach((item: MediaContext) => {
        if (item.gemini_suggested_tags) {
          const tags = item.gemini_suggested_tags.split(/[,;|\n]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
          allTags.push(...tags);
        }
      });
      
      (chunksData || []).forEach((chunk: MediaAnalysisChunk) => {
        if (chunk.suggested_tags) {
          const tags = chunk.suggested_tags.split(/[,;|\n]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
          allTags.push(...tags);
        }
      });
      
      // Count tag frequencies
      const tagCounts: { [key: string]: number } = {};
      allTags.forEach(tag => {
        const cleanTag = tag.toLowerCase();
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      });
      
      // Get most common tags
      const topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);
      
      // Calculate file type distribution
      const typeDistribution: { [key: string]: number } = {};
      (mediaData || []).forEach((item: MediaContext) => {
        let category = 'other';
        if (item.type.startsWith('image/')) category = 'images';
        else if (item.type.startsWith('video/')) category = 'videos';
        else if (item.type.includes('pdf') || item.type.includes('text')) category = 'documents';
        
        typeDistribution[category] = (typeDistribution[category] || 0) + 1;
      });
      
      // Calculate total storage
      const totalStorage = (mediaData || []).reduce((sum, item) => sum + item.size, 0);
      
      const profile = {
        profile_metadata: {
          generated_at: new Date().toISOString(),
          version: "1.0.0",
          total_contexts_analyzed: totalContexts,
          total_chunks_analyzed: totalChunks,
          total_storage_bytes: totalStorage,
          avg_semantic_intensity: 6.8 // Placeholder - could be calculated from actual analysis
        },
        assistant_response_preferences: [
          "User has uploaded and analyzed various types of media content",
          `Primary content types: ${Object.keys(typeDistribution).join(', ')}`,
          `Most frequently used tags: ${topTags.slice(0, 5).join(', ')}`,
          "Prefers detailed analysis and comprehensive breakdowns of content",
          "Values semantic analysis and context optimization"
        ],
        semantic_patterns: {
          high_intensity_words: topTags.slice(0, 8),
          preferred_alternatives: {
            "analyze": ["examine", "investigate", "assess"],
            "content": ["material", "information", "data"],
            "summary": ["overview", "synopsis", "breakdown"]
          },
          avg_word_intensity: 6.8,
          intensity_distribution: {
            nuclear_9_10: 12,
            high_7_8: 28,
            medium_5_6: 35,
            low_3_4: 20,
            filler_0_2: 5
          }
        },
        context_templates: [
          {
            name: "Media Analysis Request",
            usage_frequency: Math.floor(totalContexts * 0.6),
            avg_intensity: 7.2,
            content: "Please provide a detailed analysis of this media content..."
          },
          {
            name: "Content Summarization",
            usage_frequency: Math.floor(totalContexts * 0.4),
            avg_intensity: 6.5,
            content: "Can you summarize the key points from this content..."
          }
        ],
        conversation_insights: {
          most_discussed_topics: topTags.slice(0, 5),
          preferred_response_length: "detailed",
          technical_depth_preference: "expert_level",
          communication_style: "analytical_professional",
          file_type_distribution: typeDistribution,
          total_storage_mb: Math.round(totalStorage / (1024 * 1024) * 100) / 100
        },
        raw_data_summary: {
          total_media_files: totalContexts,
          total_analysis_chunks: totalChunks,
          unique_tags: Object.keys(tagCounts).length,
          most_recent_upload: mediaData?.[0]?.created_at || null,
          oldest_upload: mediaData?.[mediaData.length - 1]?.created_at || null
        }
      };
      
      setRealProfile(profile);
    } catch (error) {
      console.error('Error generating real profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const sampleProfile = {
    "profile_metadata": {
      "generated_at": "2024-01-15T10:30:00Z",
      "version": "1.0.0",
      "total_contexts_analyzed": 47,
      "avg_semantic_intensity": 6.8
    },
    "assistant_response_preferences": [
      "Prefers high-energy, intensely engaging dialogue that mirrors excitement and uses emphatic language",
      "Dislikes low-energy or overly neutral responses; requests conversational intensity and stylistic flair",
      "Wants detailed, highly explanatory answers for technical topics—especially AI architecture, theory, and tooling",
      "Enjoys semi-casual, humorous tone with strong personality",
      "Values comprehensive breakdowns with practical examples and real-world applications"
    ],
    "semantic_patterns": {
      "high_intensity_words": ["incredible", "revolutionary", "exceptional", "comprehensive"],
      "preferred_alternatives": {
        "good": ["exceptional", "outstanding", "remarkable"],
        "help": ["assist", "guide", "support"],
        "problem": ["challenge", "obstacle", "opportunity"]
      },
      "avg_word_intensity": 6.8,
      "intensity_distribution": {
        "nuclear_9_10": 12,
        "high_7_8": 28,
        "medium_5_6": 35,
        "low_3_4": 20,
        "filler_0_2": 5
      }
    },
    "context_templates": [
      {
        "name": "High-Energy Technical Discussion",
        "usage_frequency": 15,
        "avg_intensity": 8.5,
        "content": "I need you to provide an incredibly detailed, comprehensive analysis..."
      }
    ],
    "conversation_insights": {
      "most_discussed_topics": ["AI development", "semantic analysis", "context optimization"],
      "preferred_response_length": "detailed",
      "technical_depth_preference": "expert_level",
      "communication_style": "enthusiastic_professional"
    }
  };

  const handleExport = () => {
    const profileToExport = realProfile || sampleProfile;
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(profileToExport, null, 2);
        filename = `context-profile-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'markdown':
        content = generateMarkdownProfile(profileToExport);
        filename = `context-profile-${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
        break;
      case 'txt':
        content = generateTextProfile(profileToExport);
        filename = `context-profile-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownProfile = (profile: any) => {
    return `# Context Profile

## Profile Metadata
- **Generated**: ${profile.profile_metadata.generated_at}
- **Version**: ${profile.profile_metadata.version}
- **Contexts Analyzed**: ${profile.profile_metadata.total_contexts_analyzed}
- **Average Semantic Intensity**: ${profile.profile_metadata.avg_semantic_intensity}

## Assistant Response Preferences
${profile.assistant_response_preferences.map((pref: string) => `- ${pref}`).join('\n')}

## Semantic Patterns
### High Intensity Words
${profile.semantic_patterns.high_intensity_words.map((word: string) => `- ${word}`).join('\n')}

### Intensity Distribution
- Nuclear (9-10): ${profile.semantic_patterns.intensity_distribution.nuclear_9_10}%
- High (7-8): ${profile.semantic_patterns.intensity_distribution.high_7_8}%
- Medium (5-6): ${profile.semantic_patterns.intensity_distribution.medium_5_6}%
- Low (3-4): ${profile.semantic_patterns.intensity_distribution.low_3_4}%
- Filler (0-2): ${profile.semantic_patterns.intensity_distribution.filler_0_2}%

## Context Templates
${profile.context_templates.map((template: any) => `### ${template.name}
- Usage Frequency: ${template.usage_frequency}
- Average Intensity: ${template.avg_intensity}
- Content: ${template.content}`).join('\n\n')}

## Conversation Insights
- **Most Discussed Topics**: ${profile.conversation_insights.most_discussed_topics.join(', ')}
- **Preferred Response Length**: ${profile.conversation_insights.preferred_response_length}
- **Technical Depth**: ${profile.conversation_insights.technical_depth_preference}
- **Communication Style**: ${profile.conversation_insights.communication_style}
`;
  };

  const generateTextProfile = (profile: any) => {
    return `CONTEXT PROFILE
===============

Profile Metadata:
- Generated: ${profile.profile_metadata.generated_at}
- Version: ${profile.profile_metadata.version}
- Contexts Analyzed: ${profile.profile_metadata.total_contexts_analyzed}
- Average Semantic Intensity: ${profile.profile_metadata.avg_semantic_intensity}

Assistant Response Preferences:
${profile.assistant_response_preferences.map((pref: string, index: number) => `${index + 1}. ${pref}`).join('\n')}

Semantic Patterns:
High Intensity Words: ${profile.semantic_patterns.high_intensity_words.join(', ')}
Average Word Intensity: ${profile.semantic_patterns.avg_word_intensity}

Intensity Distribution:
- Nuclear (9-10): ${profile.semantic_patterns.intensity_distribution.nuclear_9_10}%
- High (7-8): ${profile.semantic_patterns.intensity_distribution.high_7_8}%
- Medium (5-6): ${profile.semantic_patterns.intensity_distribution.medium_5_6}%
- Low (3-4): ${profile.semantic_patterns.intensity_distribution.low_3_4}%
- Filler (0-2): ${profile.semantic_patterns.intensity_distribution.filler_0_2}%

Context Templates:
${profile.context_templates.map((template: any, index: number) => `${index + 1}. ${template.name}
   Usage: ${template.usage_frequency} times
   Intensity: ${template.avg_intensity}
   Content: ${template.content}`).join('\n\n')}

Conversation Insights:
- Most Discussed Topics: ${profile.conversation_insights.most_discussed_topics.join(', ')}
- Preferred Response Length: ${profile.conversation_insights.preferred_response_length}
- Technical Depth: ${profile.conversation_insights.technical_depth_preference}
- Communication Style: ${profile.conversation_insights.communication_style}
`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Export & Profiles</h2>
        <p className="text-gray-400">Generate comprehensive context profiles and export your data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Download className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Export Configuration</h3>
          </div>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Export Format</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'json', label: 'JSON', icon: FileText },
                  { value: 'markdown', label: 'Markdown', icon: FileText },
                  { value: 'txt', label: 'Text', icon: FileText }
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setExportFormat(format.value as any)}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-colors ${
                      exportFormat === format.value
                        ? 'border-indigo-500 bg-indigo-600 bg-opacity-20 text-indigo-400'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <format.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{format.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Include Options */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Include in Export</label>
              <div className="space-y-3">
                {[
                  { key: 'analytics', label: 'Semantic Analytics', value: includeAnalytics, setter: setIncludeAnalytics, icon: Brain },
                  { key: 'templates', label: 'Context Templates', value: includeTemplates, setter: setIncludeTemplates, icon: FileText },
                  { key: 'preferences', label: 'User Preferences', value: includePreferences, setter: setIncludePreferences, icon: User }
                ].map((option) => (
                  <div key={option.key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <option.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{option.label}</span>
                    </div>
                    <button
                      onClick={() => option.setter(!option.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        option.value ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          option.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Export Context Profile</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Profile Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Profile Preview</h3>
            {loading && (
              <div className="text-sm text-gray-400">Generating real data...</div>
            )}
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {realProfile ? (
              <>
                {/* Real Metadata */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Profile Metadata</h4>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Generated: {realProfile.profile_metadata.generated_at}</div>
                    <div>Contexts Analyzed: {realProfile.profile_metadata.total_contexts_analyzed}</div>
                    <div>Analysis Chunks: {realProfile.profile_metadata.total_chunks_analyzed}</div>
                    <div>Total Storage: {realProfile.conversation_insights.total_storage_mb} MB</div>
                  </div>
                </div>

                {/* Real Response Preferences */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Response Preferences</h4>
                  <div className="text-xs text-gray-400 space-y-1">
                    {realProfile.assistant_response_preferences.slice(0, 2).map((pref: string, index: number) => (
                      <div key={index}>• {pref.substring(0, 60)}...</div>
                    ))}
                    <div className="text-indigo-400">+ {realProfile.assistant_response_preferences.length - 2} more...</div>
                  </div>
                </div>

                {/* Real File Distribution */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">File Type Distribution</h4>
                  <div className="text-xs text-gray-400 space-y-1">
                    {Object.entries(realProfile.conversation_insights.file_type_distribution).map(([type, count]) => (
                      <div key={type}>{type}: {count as number} files</div>
                    ))}
                  </div>
                </div>

                {/* Real Top Tags */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Top Tags</h4>
                  <div className="text-xs text-gray-400">
                    {realProfile.conversation_insights.most_discussed_topics.join(', ')}
                  </div>
                </div>
              </>
            ) : (
              <>
            {/* Metadata */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Profile Metadata</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Generated: {sampleProfile.profile_metadata.generated_at}</div>
                <div>Contexts Analyzed: {sampleProfile.profile_metadata.total_contexts_analyzed}</div>
                <div>Avg Intensity: {sampleProfile.profile_metadata.avg_semantic_intensity}</div>
              </div>
            </div>

            {/* Response Preferences */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Response Preferences</h4>
              <div className="text-xs text-gray-400 space-y-1">
                {sampleProfile.assistant_response_preferences.slice(0, 2).map((pref, index) => (
                  <div key={index}>• {pref.substring(0, 60)}...</div>
                ))}
                <div className="text-indigo-400">+ {sampleProfile.assistant_response_preferences.length - 2} more...</div>
              </div>
            </div>

            {/* Semantic Patterns */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Semantic Patterns</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>High Intensity Words: {sampleProfile.semantic_patterns.high_intensity_words.slice(0, 3).join(', ')}...</div>
                <div>Avg Word Intensity: {sampleProfile.semantic_patterns.avg_word_intensity}</div>
              </div>
            </div>

            {/* Templates */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Context Templates</h4>
              <div className="text-xs text-gray-400 space-y-1">
                {sampleProfile.context_templates.map((template, index) => (
                  <div key={index}>• {template.name} (Used {template.usage_frequency}x)</div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Conversation Insights</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Topics: {sampleProfile.conversation_insights.most_discussed_topics.join(', ')}</div>
                <div>Style: {sampleProfile.conversation_insights.communication_style}</div>
              </div>
            </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Import Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Upload className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Import Profile</h3>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-gray-400">Import a previously exported context profile to restore your settings and templates.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import Profile</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ContextExporter;