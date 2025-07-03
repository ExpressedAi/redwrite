import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Search, 
  Zap, 
  Link, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Tag,
  Brain,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';
import { analyzeTextWithGeminiChunking } from '../../utils/aiAnalysis';

interface ExtractionJob {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  urls: string[];
  prompt: string;
  data?: any;
  error?: string;
  progress?: number;
}

const ContextSearch: React.FC = () => {
  const { geminiApiKey, autoAnalysis } = useSettings();
  const [urls, setUrls] = useState('');
  const [prompt, setPrompt] = useState('Extract the main content, key insights, and important information from these pages.');
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [enableFire1, setEnableFire1] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentJob, setCurrentJob] = useState<ExtractionJob | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const quickPrompts = [
    "Extract the main content, key insights, and important information from these pages.",
    "Summarize the key points and actionable insights from this content.",
    "Extract technical details, specifications, and implementation notes.",
    "Identify the main topics, themes, and important concepts discussed.",
    "Extract contact information, company details, and business information."
  ];

  const handleExtract = async () => {
    if (!urls.trim()) {
      toast.error('Please enter at least one URL to extract from.');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt describing what to extract.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractedData(null);
      
      // Parse URLs from input
      const urlList = urls.split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)
        .map(url => {
          // Add https:// if no protocol specified
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
          }
          return url;
        });

      toast.success(`Starting extraction from ${urlList.length} URL${urlList.length > 1 ? 's' : ''}...`);

      // Create extraction options
      const extractOptions: any = {
        action: 'extract',
        urls: urlList,
        prompt: prompt,
        enableWebSearch: enableWebSearch
      };

      // Add FIRE-1 agent if enabled
      if (enableFire1) {
        extractOptions.agent = {
          model: 'FIRE-1'
        };
      }

      // Call Supabase Edge Function instead of Firecrawl directly
      const { data: extractResult, error } = await supabase.functions.invoke('firecrawl-proxy', {
        body: extractOptions
      });

      if (error) {
        throw new Error(error.message || 'Failed to start extraction');
      }

      if (!extractResult.jobId) {
        throw new Error('No job ID returned from extraction service');
      }
      
      const job: ExtractionJob = {
        id: extractResult.jobId,
        status: 'processing',
        urls: urlList,
        prompt: prompt
      };
      
      setCurrentJob(job);
      
      // Poll for completion
      await pollJobStatus(extractResult.jobId);
      
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsExtracting(false);
      setCurrentJob(null);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        
        // Call Supabase Edge Function to get status
        const { data: statusResult, error } = await supabase.functions.invoke('firecrawl-proxy', {
          body: {
            action: 'getExtractStatus',
            jobId: jobId
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to get extraction status');
        }
        
        setCurrentJob(prev => prev ? {
          ...prev,
          status: statusResult.status as any,
          progress: statusResult.progress || 0,
          data: statusResult.data,
          error: statusResult.error
        } : null);

        if (statusResult.status === 'completed') {
          setExtractedData(statusResult.data);
          setIsExtracting(false);
          toast.success('Extraction completed successfully!');
          
          // If auto-analysis is enabled and we have Gemini API key, analyze the extracted content
          if (autoAnalysis && geminiApiKey && statusResult.data) {
            await analyzeExtractedContent(statusResult.data);
          }
          
          return;
        } else if (statusResult.status === 'failed') {
          setIsExtracting(false);
          toast.error(`Extraction failed: ${statusResult.error || 'Unknown error'}`);
          return;
        } else if (statusResult.status === 'cancelled') {
          setIsExtracting(false);
          toast.error('Extraction was cancelled');
          return;
        }

        // Continue polling if still processing
        if (attempts < maxAttempts && statusResult.status === 'processing') {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else if (attempts >= maxAttempts) {
          setIsExtracting(false);
          toast.error('Extraction timed out. Please try again.');
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        setIsExtracting(false);
        toast.error('Failed to check extraction status');
      }
    };

    // Start polling
    setTimeout(poll, 2000); // Initial delay of 2 seconds
  };

  const analyzeExtractedContent = async (data: any) => {
    try {
      toast.success('Starting AI analysis of extracted content...');
      
      // Convert extracted data to text for analysis
      let contentText = '';
      if (typeof data === 'string') {
        contentText = data;
      } else if (typeof data === 'object') {
        contentText = JSON.stringify(data, null, 2);
      } else {
        contentText = String(data);
      }
      
      // Create a filename based on the URLs
      const urlCount = currentJob?.urls.length || 1;
      const fileName = `Firecrawl_Extract_${urlCount}_URLs_${new Date().toISOString().split('T')[0]}.txt`;
      
      await analyzeTextWithGeminiChunking(contentText, fileName, geminiApiKey);
      
      toast.success('Content extracted and analyzed successfully!');
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Extraction succeeded but analysis failed. Content saved without AI analysis.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader className="w-4 h-4 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'cancelled':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Context Search</h2>
        <p className="text-gray-400">Extract and analyze content from web pages using Firecrawl</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extraction Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Web Content Extraction</h3>
          </div>

          <div className="space-y-4">
            {/* URLs Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URLs to Extract From
              </label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com&#10;https://docs.example.com/*&#10;https://blog.example.com/post-1"
                className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter one URL per line. Use /* for wildcard crawling.
              </p>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Extraction Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what information you want to extract..."
                className="w-full h-20 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {quickPrompts.slice(0, 3).map((quickPrompt, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(quickPrompt)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                  >
                    Quick {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Enable Web Search</p>
                    <p className="text-sm text-gray-400">Follow links for broader context</p>
                  </div>
                </div>
                <button
                  onClick={() => setEnableWebSearch(!enableWebSearch)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableWebSearch ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableWebSearch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-white font-medium">Enable FIRE-1 Agent</p>
                    <p className="text-sm text-gray-400">AI agent for complex navigation</p>
                  </div>
                </div>
                <button
                  onClick={() => setEnableFire1(!enableFire1)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableFire1 ? 'bg-orange-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableFire1 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Extract Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExtract}
              disabled={isExtracting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isExtracting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  <span>Extract Content</span>
                </>
              )}
            </motion.button>

            <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-sm text-green-300">
                  Using secure Supabase Edge Function proxy for Firecrawl API.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Status and Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Extraction Status</h3>
          </div>

          {currentJob ? (
            <div className="space-y-4">
              {/* Job Status */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(currentJob.status)}
                    <span className={`font-medium ${getStatusColor(currentJob.status)}`}>
                      {currentJob.status.charAt(0).toUpperCase() + currentJob.status.slice(1)}
                    </span>
                  </div>
                  {currentJob.progress !== undefined && (
                    <span className="text-sm text-gray-400">{currentJob.progress}%</span>
                  )}
                </div>
                
                {currentJob.progress !== undefined && (
                  <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentJob.progress}%` }}
                    ></div>
                  </div>
                )}

                <div className="text-sm text-gray-300">
                  <p><strong>URLs:</strong> {currentJob.urls.length} URL{currentJob.urls.length > 1 ? 's' : ''}</p>
                  <p><strong>Prompt:</strong> {currentJob.prompt.substring(0, 100)}...</p>
                </div>

                {currentJob.error && (
                  <div className="mt-3 p-2 bg-red-900 bg-opacity-20 border border-red-700 rounded">
                    <p className="text-sm text-red-300">{currentJob.error}</p>
                  </div>
                )}
              </div>

              {/* URLs List */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Processing URLs:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {currentJob.urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Link className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300 truncate">{url}</span>
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No extraction in progress</p>
              <p className="text-sm text-gray-500 mt-1">
                Configure URLs and prompt above to start extracting content
              </p>
            </div>
          )}

          {/* Extracted Data Preview */}
          {extractedData && (
            <div className="mt-6 bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Extracted Data Preview:</h4>
              <div className="bg-gray-800 rounded p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {typeof extractedData === 'string' 
                    ? extractedData.substring(0, 500) + (extractedData.length > 500 ? '...' : '')
                    : JSON.stringify(extractedData, null, 2).substring(0, 500) + '...'
                  }
                </pre>
              </div>
              {autoAnalysis && geminiApiKey && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-green-400">
                  <Brain className="w-4 h-4" />
                  <span>Content will be automatically analyzed with Gemini AI</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Features Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Firecrawl Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h4 className="font-medium text-white">Smart Crawling</h4>
            </div>
            <p className="text-sm text-gray-300">
              Extract structured data from single pages or entire domains with wildcard support.
            </p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-orange-400" />
              <h4 className="font-medium text-white">FIRE-1 Agent</h4>
            </div>
            <p className="text-sm text-gray-300">
              AI agent that can navigate complex sites, click buttons, and handle dynamic content.
            </p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <h4 className="font-medium text-white">AI Analysis</h4>
            </div>
            <p className="text-sm text-gray-300">
              Automatically analyze extracted content with Gemini AI for insights and context.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContextSearch;