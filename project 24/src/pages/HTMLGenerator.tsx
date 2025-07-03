import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Code, 
  Sparkles, 
  Eye, 
  Upload, 
  Download, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Save,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  Copy,
  Share,
  BarChart3,
  Calendar,
  Tag
} from 'lucide-react';
import { supabase, MediaContext, GeneratedHtmlPage } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import toast from 'react-hot-toast';

const HTMLGenerator: React.FC = () => {
  const { geminiApiKey } = useSettings();
  const [mediaContexts, setMediaContexts] = useState<MediaContext[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<Set<string>>(new Set());
  const [customPrompt, setCustomPrompt] = useState('Create a beautiful, modern HTML page showcasing this content. Include proper styling, responsive design, and professional typography. Make it production-ready.');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedPages, setPublishedPages] = useState<GeneratedHtmlPage[]>([]);
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [previewMode, setPreviewMode] = useState<'code' | 'visual'>('visual');
  const [loadingPages, setLoadingPages] = useState(true);

  const promptTemplates = [
    {
      name: 'Professional Report',
      prompt: 'Create a professional business report-style HTML page with clean typography, structured sections, and corporate styling. Include a table of contents and proper headings hierarchy.'
    },
    {
      name: 'Modern Blog Post',
      prompt: 'Design a modern blog post layout with beautiful typography, engaging visuals, and social media ready styling. Include author info and reading time estimates.'
    },
    {
      name: 'Documentation Page',
      prompt: 'Build a technical documentation page with code syntax highlighting, clear navigation, and developer-friendly styling. Include search functionality and responsive design.'
    },
    {
      name: 'Portfolio Showcase',
      prompt: 'Create an elegant portfolio-style page with grid layouts, hover effects, and modern animations. Focus on visual appeal and user experience.'
    },
    {
      name: 'Landing Page',
      prompt: 'Design a conversion-focused landing page with compelling headlines, clear call-to-actions, and persuasive layout. Include testimonials and feature sections.'
    }
  ];

  useEffect(() => {
    fetchMediaContexts();
    fetchPublishedPages();
  }, []);

  const fetchMediaContexts = async () => {
    try {
      const { data, error } = await supabase
        .from('media_contexts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMediaContexts(data || []);
    } catch (error) {
      console.error('Error fetching media contexts:', error);
      toast.error('Failed to load media contexts');
    }
  };

  const fetchPublishedPages = async () => {
    try {
      setLoadingPages(true);
      const { data, error } = await supabase
        .from('generated_html_pages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPublishedPages(data || []);
    } catch (error) {
      console.error('Error fetching published pages:', error);
      toast.error('Failed to load published pages');
    } finally {
      setLoadingPages(false);
    }
  };

  const toggleContextSelection = (contextId: string) => {
    const newSelection = new Set(selectedContexts);
    if (newSelection.has(contextId)) {
      newSelection.delete(contextId);
    } else {
      newSelection.add(contextId);
    }
    setSelectedContexts(newSelection);
  };

  const generateHTML = async () => {
    if (!geminiApiKey) {
      toast.error('Gemini API key not configured. Please set it in Settings.');
      return;
    }

    if (selectedContexts.size === 0) {
      toast.error('Please select at least one media context to include.');
      return;
    }

    if (!customPrompt.trim()) {
      toast.error('Please provide a prompt for HTML generation.');
      return;
    }

    try {
      setIsGenerating(true);
      toast.success('Generating HTML with Gemini AI...');

      // Gather content from selected contexts
      const selectedMedia = mediaContexts.filter(ctx => selectedContexts.has(ctx.id));
      let contentForGeneration = '';

      selectedMedia.forEach((media, index) => {
        contentForGeneration += `\n\n=== CONTENT ${index + 1}: ${media.name} ===\n`;
        
        if (media.gemini_summary) {
          contentForGeneration += `Summary: ${media.gemini_summary}\n`;
        }
        
        if (media.gemini_key_insights) {
          contentForGeneration += `Key Insights: ${media.gemini_key_insights}\n`;
        }
        
        if (media.gemini_notable_features) {
          contentForGeneration += `Notable Features: ${media.gemini_notable_features}\n`;
        }
        
        if (media.gemini_suggested_tags) {
          contentForGeneration += `Tags: ${media.gemini_suggested_tags}\n`;
        }
      });

      const fullPrompt = `${customPrompt}

CONTENT TO INCLUDE:
${contentForGeneration}

REQUIREMENTS:
- Create a complete, standalone HTML document
- Include all CSS styling inline within <style> tags in the <head>
- Use modern, responsive design principles
- Ensure the page looks professional and production-ready
- Include proper meta tags and SEO optimization
- Make the design mobile-friendly
- Use beautiful typography and color schemes
- Include smooth animations and hover effects where appropriate
- Structure the content logically with proper headings and sections
- Add a footer with generation timestamp

Return ONLY the complete HTML code, no explanations or markdown formatting.`;

      const requestBody = {
        contents: [{
          parts: [{
            text: fullPrompt
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
        let htmlContent = data.candidates[0].content.parts[0].text;
        
        // Clean up the HTML content
        htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Ensure it starts with <!DOCTYPE html>
        if (!htmlContent.toLowerCase().startsWith('<!doctype html>')) {
          htmlContent = '<!DOCTYPE html>\n' + htmlContent;
        }

        setGeneratedHtml(htmlContent);
        toast.success('HTML generated successfully!');
      } else {
        throw new Error('Unexpected response format from Gemini API');
      }

    } catch (error) {
      console.error('HTML generation error:', error);
      toast.error(`Failed to generate HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const publishHTML = async () => {
    if (!generatedHtml.trim()) {
      toast.error('No HTML content to publish. Generate HTML first.');
      return;
    }

    if (!pageTitle.trim()) {
      toast.error('Please provide a title for the page.');
      return;
    }

    try {
      setIsPublishing(true);
      toast.success('Publishing HTML page...');

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${pageTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.html`;

      // Upload HTML to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-html')
        .upload(filename, generatedHtml, {
          contentType: 'text/html',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload HTML: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('generated-html')
        .getPublicUrl(filename);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded HTML');
      }

      // Save page metadata to database
      const pageData = {
        name: pageTitle,
        description: pageDescription || null,
        html_content: generatedHtml,
        public_url: urlData.publicUrl,
        media_context_ids: Array.from(selectedContexts),
        gemini_prompt: customPrompt,
        status: 'published' as const,
        file_size: new Blob([generatedHtml]).size
      };

      const { data: insertData, error: insertError } = await supabase
        .from('generated_html_pages')
        .insert([pageData])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save page metadata: ${insertError.message}`);
      }

      toast.success('HTML page published successfully!');
      
      // Reset form and refresh pages list
      setGeneratedHtml('');
      setPageTitle('');
      setPageDescription('');
      setSelectedContexts(new Set());
      await fetchPublishedPages();

      // Open the published page
      window.open(urlData.publicUrl, '_blank');

    } catch (error) {
      console.error('Publishing error:', error);
      toast.error(`Failed to publish HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const deletePage = async (pageId: string) => {
    if (!window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('generated_html_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      toast.success('Page deleted successfully!');
      await fetchPublishedPages();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete page');
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
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">HTML Generator</h1>
        <p className="text-gray-400 mb-8">
          Generate beautiful, production-ready HTML pages from your analyzed content and host them instantly
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Content Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Select Content</h3>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mediaContexts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No media contexts available. Upload some files first!
              </p>
            ) : (
              mediaContexts.map((context) => (
                <div
                  key={context.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedContexts.has(context.id)
                      ? 'border-indigo-500 bg-indigo-600 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => toggleContextSelection(context.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedContexts.has(context.id)
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-500'
                    }`}>
                      {selectedContexts.has(context.id) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{context.name}</p>
                      <p className="text-gray-400 text-sm">
                        {formatFileSize(context.size)} • {formatDate(context.created_at)}
                      </p>
                      {context.gemini_summary && (
                        <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                          {context.gemini_summary.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 text-sm text-gray-400">
            {selectedContexts.size} of {mediaContexts.length} items selected
          </div>
        </motion.div>

        {/* Generation Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Generation Settings</h3>
          </div>

          <div className="space-y-4">
            {/* Page Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Page Title
              </label>
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Enter a title for your HTML page"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Page Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={pageDescription}
                onChange={(e) => setPageDescription(e.target.value)}
                placeholder="Brief description of the page"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Prompt Templates */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quick Templates
              </label>
              <div className="grid grid-cols-1 gap-2">
                {promptTemplates.slice(0, 3).map((template, index) => (
                  <button
                    key={index}
                    onClick={() => setCustomPrompt(template.prompt)}
                    className="text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Generation Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the style and structure you want for your HTML page..."
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Generate Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateHTML}
              disabled={isGenerating || selectedContexts.size === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate HTML</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Preview and Publish */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold text-white">Preview & Publish</h3>
            </div>
            {generatedHtml && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setPreviewMode(previewMode === 'visual' ? 'code' : 'visual')}
                  className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors"
                >
                  {previewMode === 'visual' ? 'Code' : 'Visual'}
                </button>
                <button
                  onClick={() => copyToClipboard(generatedHtml)}
                  className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded transition-colors flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            )}
          </div>

          {generatedHtml ? (
            <div className="space-y-4">
              {/* Preview */}
              <div className="bg-gray-700 rounded-lg p-4 max-h-64 overflow-auto">
                {previewMode === 'visual' ? (
                  <iframe
                    srcDoc={generatedHtml}
                    className="w-full h-48 border-0 rounded"
                    title="HTML Preview"
                  />
                ) : (
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                    {generatedHtml.substring(0, 1000)}
                    {generatedHtml.length > 1000 && '...'}
                  </pre>
                )}
              </div>

              {/* Publish Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={publishHTML}
                disabled={isPublishing || !pageTitle.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {isPublishing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Publish to Web</span>
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Code className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No HTML generated yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Select content and generate HTML to see preview
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Published Pages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Globe className="w-6 h-6 text-indigo-400" />
          <h3 className="text-xl font-semibold text-white">Published Pages</h3>
        </div>

        {loadingPages ? (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
            <p className="text-gray-400">Loading published pages...</p>
          </div>
        ) : publishedPages.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No pages published yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Generate and publish your first HTML page to see it here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedPages.map((page) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{page.name}</h4>
                    {page.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{page.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => window.open(page.public_url, '_blank')}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Open page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(page.public_url || '')}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePage(page.id)}
                      className="p-1 text-gray-400 hover:text-red-400"
                      title="Delete page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(page.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-3 h-3" />
                    <span>{formatFileSize(page.file_size)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-3 h-3" />
                    <span>{page.view_count} views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tag className="w-3 h-3" />
                    <span>{page.media_context_ids.length} sources</span>
                  </div>
                </div>

                <div className={`mt-3 px-2 py-1 rounded text-xs font-medium ${
                  page.status === 'published' 
                    ? 'bg-green-600 bg-opacity-20 text-green-400'
                    : page.status === 'draft'
                    ? 'bg-yellow-600 bg-opacity-20 text-yellow-400'
                    : 'bg-gray-600 bg-opacity-20 text-gray-400'
                }`}>
                  {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HTMLGenerator;