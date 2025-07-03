import React, { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, BarChart3, Target, Lightbulb, FileText } from 'lucide-react';

interface WordAnalysis {
  word: string;
  intensity: number;
  alternatives: {
    stronger: string[];
    softer: string[];
    lateral: string[];
  };
}

const SemanticAnalyzer: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<{
    words: WordAnalysis[];
    avgIntensity: number;
    strongWords: number;
    weakWords: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordAnalysis | null>(null);
  const [sourceFile, setSourceFile] = useState<string | null>(null);

  const quickTestPrompts = [
    "In the beginning of this conversation we were talking about a cementicle analysis tool",
    "We need to enhance our approach to this challenging problem",
    "This is absolutely incredible and revolutionary for our workflow",
    "Please help me understand the basic concepts"
  ];

  useEffect(() => {
    // Check if there's content from media analysis to pre-populate
    const storedContent = sessionStorage.getItem('semanticAnalysisContent');
    const storedSource = sessionStorage.getItem('semanticAnalysisSource');
    
    if (storedContent) {
      setInputText(storedContent);
      setSourceFile(storedSource);
      // Clear the stored content after using it
      sessionStorage.removeItem('semanticAnalysisContent');
      sessionStorage.removeItem('semanticAnalysisSource');
    }
  }, []);
  const analyzeText = async (text: string) => {
    setIsAnalyzing(true);
    
    // Simulate API call with realistic delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const wordAnalyses: WordAnalysis[] = words.map(word => {
      const intensity = calculateWordIntensity(word);
      return {
        word,
        intensity,
        alternatives: generateAlternatives(word, intensity)
      };
    });
    
    const avgIntensity = wordAnalyses.reduce((sum, w) => sum + w.intensity, 0) / wordAnalyses.length;
    const strongWords = wordAnalyses.filter(w => w.intensity >= 7).length;
    const weakWords = wordAnalyses.filter(w => w.intensity <= 3).length;
    
    setAnalysis({
      words: wordAnalyses,
      avgIntensity,
      strongWords,
      weakWords
    });
    
    setIsAnalyzing(false);
  };

  const calculateWordIntensity = (word: string): number => {
    const intensityMap: { [key: string]: number } = {
      // High intensity words
      'absolutely': 9, 'incredible': 8, 'revolutionary': 9, 'amazing': 8,
      'outstanding': 8, 'exceptional': 8, 'brilliant': 8, 'fantastic': 8,
      'extraordinary': 9, 'phenomenal': 9, 'spectacular': 8, 'magnificent': 8,
      
      // Medium-high intensity
      'excellent': 7, 'great': 6, 'wonderful': 7, 'impressive': 7,
      'remarkable': 7, 'significant': 6, 'important': 6, 'powerful': 7,
      'strong': 6, 'effective': 6, 'successful': 6, 'valuable': 6,
      
      // Medium intensity
      'good': 5, 'nice': 4, 'fine': 4, 'okay': 3, 'decent': 4,
      'reasonable': 4, 'adequate': 3, 'acceptable': 3, 'standard': 4,
      'normal': 3, 'regular': 3, 'typical': 3, 'common': 3,
      
      // Low intensity
      'basic': 2, 'simple': 2, 'plain': 2, 'ordinary': 2,
      'minimal': 2, 'slight': 2, 'minor': 2, 'small': 2,
      'little': 2, 'weak': 1, 'poor': 1, 'bad': 1,
      
      // Context-specific words
      'beginning': 6, 'conversation': 5, 'talking': 4, 'analysis': 6,
      'tool': 4, 'enhance': 6, 'approach': 5, 'challenging': 6,
      'problem': 5, 'workflow': 5, 'understand': 5, 'concepts': 5,
      'help': 4, 'please': 3, 'need': 5, 'were': 2, 'this': 2,
      'that': 2, 'with': 1, 'and': 1, 'the': 1, 'for': 1, 'our': 2
    };
    
    return intensityMap[word] || Math.floor(Math.random() * 5) + 3; // Default 3-7 range
  };

  const generateAlternatives = (word: string, intensity: number) => {
    const alternatives: { [key: string]: any } = {
      'beginning': {
        stronger: ['inception', 'genesis', 'initiation'],
        softer: ['start', 'opening', 'first'],
        lateral: ['commencement', 'outset', 'dawn']
      },
      'conversation': {
        stronger: ['dialogue', 'discourse', 'exchange'],
        softer: ['chat', 'talk', 'discussion'],
        lateral: ['interaction', 'communication', 'correspondence']
      },
      'talking': {
        stronger: ['discussing', 'deliberating', 'analyzing'],
        softer: ['mentioning', 'noting', 'saying'],
        lateral: ['conversing', 'communicating', 'sharing']
      },
      'analysis': {
        stronger: ['examination', 'investigation', 'assessment'],
        softer: ['review', 'look', 'check'],
        lateral: ['evaluation', 'study', 'breakdown']
      },
      'tool': {
        stronger: ['system', 'platform', 'solution'],
        softer: ['utility', 'helper', 'aid'],
        lateral: ['instrument', 'resource', 'application']
      },
      'enhance': {
        stronger: ['revolutionize', 'transform', 'amplify'],
        softer: ['improve', 'adjust', 'refine'],
        lateral: ['optimize', 'upgrade', 'develop']
      },
      'approach': {
        stronger: ['strategy', 'methodology', 'framework'],
        softer: ['way', 'method', 'technique'],
        lateral: ['process', 'procedure', 'system']
      },
      'challenging': {
        stronger: ['formidable', 'demanding', 'complex'],
        softer: ['difficult', 'tricky', 'tough'],
        lateral: ['intricate', 'involved', 'sophisticated']
      },
      'problem': {
        stronger: ['crisis', 'challenge', 'obstacle'],
        softer: ['issue', 'matter', 'concern'],
        lateral: ['situation', 'question', 'puzzle']
      }
    };
    
    return alternatives[word] || {
      stronger: ['enhanced', 'amplified', 'intensified'],
      softer: ['basic', 'simple', 'gentle'],
      lateral: ['alternative', 'different', 'varied']
    };
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 2) return 'bg-gray-600 text-gray-300';
    if (intensity <= 4) return 'bg-yellow-600 text-yellow-100';
    if (intensity <= 6) return 'bg-orange-600 text-orange-100';
    if (intensity <= 8) return 'bg-red-600 text-red-100';
    return 'bg-red-800 text-red-100';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity <= 2) return 'Filler (0-2)';
    if (intensity <= 4) return 'Low (3-4)';
    if (intensity <= 6) return 'Medium (5-6)';
    if (intensity <= 8) return 'High (7-8)';
    return 'Nuclear (9-10)';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-semibold text-white">Enter Your Prompt</h2>
        </div>
        
        <div className="space-y-4">
          {sourceFile && (
            <div className="bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg p-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">
                Analyzing content from: <strong>{sourceFile}</strong>
              </span>
              <button
                onClick={() => {
                  setSourceFile(null);
                  setInputText('');
                }}
                className="ml-auto text-blue-400 hover:text-blue-300 text-xs"
              >
                Clear
              </button>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Analyze your prompt's semantic power:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your conversation prompt or context here..."
              className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <span className="text-sm text-gray-400">Quick Test Prompts:</span>
              {quickTestPrompts.slice(0, 2).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(prompt)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                >
                  Sample {index + 1}
                </button>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => analyzeText(inputText)}
              disabled={!inputText.trim() || isAnalyzing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ANALYZING...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  <span>ANALYZE</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Semantic Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Semantic Heatmap</h3>
              <div className="flex space-x-4 text-sm">
                <span className="text-gray-300">{analysis.avgIntensity.toFixed(1)} avg intensity</span>
                <span className="text-red-400">{analysis.strongWords} strong words</span>
                <span className="text-gray-500">{analysis.weakWords} weak words</span>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 min-h-48">
              <div className="flex flex-wrap gap-2">
                {analysis.words.map((wordAnalysis, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedWord(wordAnalysis)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all hover:scale-105 ${getIntensityColor(wordAnalysis.intensity)}`}
                    title={`Intensity: ${wordAnalysis.intensity}/10`}
                  >
                    {wordAnalysis.word}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Intensity Legend */}
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Intensity Legend:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { range: 'Filler (0-2)', color: 'bg-gray-600 text-gray-300' },
                  { range: 'Low (3-4)', color: 'bg-yellow-600 text-yellow-100' },
                  { range: 'Medium (5-6)', color: 'bg-orange-600 text-orange-100' },
                  { range: 'High (7-8)', color: 'bg-red-600 text-red-100' },
                  { range: 'Nuclear (9-10)', color: 'bg-red-800 text-red-100' }
                ].map((item, index) => (
                  <span key={index} className={`px-2 py-1 rounded ${item.color}`}>
                    {item.range}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Word Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Word Analysis</h3>
            
            {selectedWord ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-white mb-2">{selectedWord.word}</h4>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <span className="text-sm text-gray-400">Intensity Level</span>
                    <span className="text-2xl font-bold text-indigo-400">{selectedWord.intensity}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-gray-500 via-yellow-500 via-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(selectedWord.intensity / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400">{getIntensityLabel(selectedWord.intensity)}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-green-400 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Stronger Alternatives
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedWord.alternatives.stronger.map((alt, index) => (
                        <span key={index} className="bg-green-600 bg-opacity-20 text-green-400 px-2 py-1 rounded text-xs">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-blue-400 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Softer Alternatives
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedWord.alternatives.softer.map((alt, index) => (
                        <span key={index} className="bg-blue-600 bg-opacity-20 text-blue-400 px-2 py-1 rounded text-xs">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-purple-400 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Lateral Alternatives
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedWord.alternatives.lateral.map((alt, index) => (
                        <span key={index} className="bg-purple-600 bg-opacity-20 text-purple-400 px-2 py-1 rounded text-xs">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Click on any word in the heatmap to see alternatives and intensity details.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SemanticAnalyzer;