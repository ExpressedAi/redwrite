import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Search, FileText, Image, Video, Sparkles, BookTemplate as Template } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase, MediaContext, MediaAnalysisChunk } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relatedMedia?: MediaContext[];
}

const Conversations: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you search through and analyze your uploaded media files. Ask me anything about your documents, images, or videos!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mediaContexts, setMediaContexts] = useState<MediaContext[]>([]);
  const [analysisChunks, setAnalysisChunks] = useState<MediaAnalysisChunk[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [contextTemplates] = useState([
    {
      id: '1',
      name: 'High-Energy Technical Discussion',
      content: 'I need you to provide an incredibly detailed, comprehensive analysis of this technical concept. Break down every component with precision and explain the underlying mechanisms with exceptional clarity.',
      intensity: 8.5,
      tags: ['technical', 'detailed', 'high-energy']
    },
    {
      id: '2',
      name: 'Casual Brainstorming',
      content: 'Let\'s explore some ideas together. I\'m looking for creative suggestions and different perspectives on this topic. Feel free to think outside the box.',
      intensity: 4.2,
      tags: ['creative', 'casual', 'brainstorming']
    },
    {
      id: '3',
      name: 'Problem-Solving Focus',
      content: 'I have a challenging problem that requires systematic analysis. Please help me break it down into components, identify root causes, and develop actionable solutions.',
      intensity: 7.1,
      tags: ['problem-solving', 'systematic', 'analytical']
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMediaContexts();
    fetchAnalysisChunks();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMediaContexts = async () => {
    try {
      const { data, error } = await supabase
        .from('media_contexts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching media contexts:', error);
        return;
      }
      
      setMediaContexts(data || []);
    } catch (error) {
      console.error('Error fetching media contexts:', error);
    }
  };

  const fetchAnalysisChunks = async () => {
    try {
      const { data, error } = await supabase
        .from('media_analysis_chunks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching analysis chunks:', error);
        return;
      }
      
      setAnalysisChunks(data || []);
    } catch (error) {
      console.error('Error fetching analysis chunks:', error);
    }
  };

  const searchMediaContexts = (query: string): MediaContext[] => {
    const searchTerms = query.toLowerCase().split(' ');
    
    // Search in both main media contexts and analysis chunks
    const matchingMediaIds = new Set<string>();
    
    // Search in main media contexts
    mediaContexts.forEach(media => {
      const searchableText = [
        media.name,
        media.gemini_summary,
        media.gemini_key_insights,
        media.gemini_suggested_tags,
        media.gemini_notable_features
      ].join(' ').toLowerCase();
      
      if (searchTerms.some(term => searchableText.includes(term))) {
        matchingMediaIds.add(media.id);
      }
    });
    
    // Search in analysis chunks
    analysisChunks.forEach(chunk => {
      const chunkSearchableText = [
        chunk.chunk_content,
        chunk.summary,
        chunk.key_insights,
        chunk.suggested_tags,
        chunk.notable_features
      ].join(' ').toLowerCase();
      
      if (searchTerms.some(term => chunkSearchableText.includes(term))) {
        matchingMediaIds.add(chunk.media_context_id);
      }
    });
    
    return mediaContexts.filter(media => matchingMediaIds.has(media.id));
  };

  const generateResponse = async (userQuery: string): Promise<{ content: string; relatedMedia: MediaContext[] }> => {
    const relatedMedia = searchMediaContexts(userQuery);
    
    if (relatedMedia.length === 0) {
      return {
        content: "I couldn't find any media files related to your query. Try uploading some documents, images, or videos first, or ask about something else!",
        relatedMedia: []
      };
    }

    // Create a contextual response based on the found media and chunks
    let response = `I found ${relatedMedia.length} relevant item${relatedMedia.length > 1 ? 's' : ''} related to your query:\n\n`;
    
    for (let i = 0; i < Math.min(3, relatedMedia.length); i++) {
      const media = relatedMedia[i];
      response += `**${media.name.trim()}**\n`;
      
      // Check if this media has chunked analysis
      const mediaChunks = analysisChunks.filter(chunk => chunk.media_context_id === media.id);
      
      if (mediaChunks.length > 0) {
        response += `Found ${mediaChunks.length} analyzed sections:\n`;
        mediaChunks.slice(0, 2).forEach((chunk, chunkIndex) => {
          if (chunk.summary) {
            response += `• Section ${chunk.chunk_index + 1}: ${chunk.summary.substring(0, 100)}${chunk.summary.length > 100 ? '...' : ''}\n`;
          }
        });
        if (mediaChunks.length > 2) {
          response += `• And ${mediaChunks.length - 2} more sections...\n`;
        }
      } else {
        // Fallback to traditional analysis
        if (media.gemini_summary) {
          response += `Summary: ${media.gemini_summary.substring(0, 150)}${media.gemini_summary.length > 150 ? '...' : ''}\n`;
        }
        if (media.gemini_key_insights) {
          response += `Key Insights: ${media.gemini_key_insights.substring(0, 100)}${media.gemini_key_insights.length > 100 ? '...' : ''}\n`;
        }
      }
      
      response += '\n';
    }

    if (relatedMedia.length > 3) {
      response += `And ${relatedMedia.length - 3} more item${relatedMedia.length - 3 > 1 ? 's' : ''}...`;
    }

    return {
      content: response,
      relatedMedia: relatedMedia.slice(0, 5) // Limit to 5 for display
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { content, relatedMedia } = await generateResponse(inputValue);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content,
        timestamp: new Date(),
        relatedMedia
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      toast.error('Failed to generate response');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMediaIcon = (type: string) => {
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

  const insertTemplate = (template: any) => {
    setInputValue(template.content);
    setShowTemplates(false);
  };
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 border-b border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Conversations</h1>
            <p className="text-gray-400">
              Chat with your AI assistant about your uploaded media and documents
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-gray-300">{mediaContexts.length} files available</span>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-3 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-indigo-600' 
                  : 'bg-gray-700'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-indigo-400" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-4 rounded-xl ${
                  message.type === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-900 text-gray-100 border border-gray-800'
                }`}>
                  <ReactMarkdown 
                    className="prose prose-invert prose-sm max-w-none"
                    components={{
                      // Custom styling for markdown elements
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-white mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-medium text-white mb-1" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-100 mb-2 last:mb-0" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-gray-200" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 text-gray-100" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 text-gray-100" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline ? (
                          <code className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-gray-200" {...props} />
                        ) : (
                          <code className="block bg-gray-700 p-2 rounded text-sm font-mono text-gray-200 overflow-x-auto" {...props} />
                        ),
                      pre: ({node, ...props}) => <pre className="bg-gray-700 p-3 rounded mb-2 overflow-x-auto" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-300 mb-2" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {/* Related Media */}
                {message.relatedMedia && message.relatedMedia.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-400 font-medium">Related Files:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {message.relatedMedia.map((media) => {
                        const Icon = getMediaIcon(media.type);
                        return (
                          <div
                            key={media.id}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-indigo-500 transition-colors"
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <Icon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-white truncate">{media.name}</span>
                            </div>
                            <p className="text-xs text-gray-400">{formatFileSize(media.size)}</p>
                            {media.gemini_summary && (
                              <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                                {media.gemini_summary.substring(0, 100)}...
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex space-x-3 max-w-4xl">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="p-6 border-t border-gray-700"
      >
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your uploaded files..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <div className="absolute right-3 top-3 text-xs text-gray-500">
              <span className="text-sm text-gray-300">
                {mediaContexts.length} files, {analysisChunks.length} analyzed sections
              </span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTemplates(!showTemplates)}
            className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-colors"
            title="Use Context Template"
          >
            <Template className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Context Templates Dropdown */}
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full mb-2 right-0 bg-gray-800 border border-gray-700 rounded-xl p-4 w-96 shadow-xl z-10"
          >
            <h3 className="text-white font-medium mb-3">Context Templates</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {contextTemplates.map((template) => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => insertTemplate(template)}
                  className="w-full text-left bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">{template.name}</span>
                    <span className="text-xs text-gray-400">Intensity: {template.intensity}</span>
                  </div>
                  <p className="text-gray-300 text-xs line-clamp-2">{template.content}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-purple-600 bg-opacity-20 text-purple-400 px-2 py-0.5 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplates(false)}
              className="mt-3 w-full text-center text-gray-400 hover:text-white text-sm"
            >
              Close
            </button>
          </motion.div>
        )}

        {/* Quick suggestions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "What files do I have?",
            "Show me recent uploads",
            "Find documents about...",
            "What images contain...?"
          ].map((suggestion, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInputValue(suggestion)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-sm border border-gray-700 transition-colors"
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Conversations;