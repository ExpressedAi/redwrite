import { supabase } from '../lib/supabase';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const CHUNK_SIZE = 10000; // Characters per chunk for text analysis

export const isTextFile = (file: File): boolean => {
  return file.type.includes('text') || 
         file.type.includes('markdown') || 
         file.name.endsWith('.md') || 
         file.name.endsWith('.txt') ||
         file.name.endsWith('.csv') ||
         file.name.endsWith('.json') ||
         file.name.endsWith('.xml');
};

export const chunkText = (text: string): string[] => {
  const chunks: string[] = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    let endIndex = currentIndex + CHUNK_SIZE;
    
    // Try to break at a natural boundary (sentence, paragraph, or word)
    if (endIndex < text.length) {
      // Look for paragraph break first
      const paragraphBreak = text.lastIndexOf('\n\n', endIndex);
      if (paragraphBreak > currentIndex) {
        endIndex = paragraphBreak + 2;
      } else {
        // Look for sentence break
        const sentenceBreak = text.lastIndexOf('. ', endIndex);
        if (sentenceBreak > currentIndex) {
          endIndex = sentenceBreak + 2;
        } else {
          // Look for word break
          const wordBreak = text.lastIndexOf(' ', endIndex);
          if (wordBreak > currentIndex) {
            endIndex = wordBreak + 1;
          }
        }
      }
    }
    
    chunks.push(text.slice(currentIndex, endIndex).trim());
    currentIndex = endIndex;
  }
  
  return chunks.filter(chunk => chunk.length > 0);
};

export const parseGeminiAnalysis = (analysis: string) => {
  // Simple parsing logic - you can make this more sophisticated
  const sections = analysis.split(/\d+\)/);
  
  return {
    summary: sections[1]?.trim() || analysis.substring(0, 200),
    keyInsights: sections[2]?.trim() || '',
    suggestedTags: sections[3]?.trim() || '',
    notableFeatures: sections[4]?.trim() || ''
  };
};

export const processChunkWithGemini = async (
  mediaContextId: string, 
  chunkIndex: number, 
  chunkContent: string, 
  fileName: string,
  geminiApiKey: string
) => {
  try {
    const requestBody = {
      contents: [{
        parts: [{
          text: `Analyze this text chunk (part ${chunkIndex + 1}) from the file "${fileName}":

${chunkContent}

Please provide:
1) A brief summary of this specific chunk's content
2) Key insights or important information from this chunk
3) Suggested tags for categorization of this chunk's content
4) Any notable features, concepts, or elements that could be useful for context

Focus specifically on this chunk's content, not the entire document.`
        }]
      }]
    };
    
    const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
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
      const analysis = data.candidates[0].content.parts[0].text;
      const parsedAnalysis = parseGeminiAnalysis(analysis);
      
      // Save chunk analysis to database
      const { error } = await supabase
        .from('media_analysis_chunks')
        .insert([
          {
            media_context_id: mediaContextId,
            chunk_index: chunkIndex,
            chunk_content: chunkContent.substring(0, 1000) + (chunkContent.length > 1000 ? '...' : ''), // Store first 1000 chars as preview
            summary: parsedAnalysis.summary,
            key_insights: parsedAnalysis.keyInsights,
            suggested_tags: parsedAnalysis.suggestedTags,
            notable_features: parsedAnalysis.notableFeatures
          }
        ]);
      
      if (error) {
        throw error;
      }
      
    } else {
      throw new Error('Unexpected response format from Gemini API');
    }
    
  } catch (error) {
    console.error(`Error processing chunk ${chunkIndex}:`, error);
    // Don't throw here, just log the error so other chunks can still be processed
  }
};

export const analyzeTextWithGeminiChunking = async (
  content: string,
  fileName: string,
  geminiApiKey: string
): Promise<string> => {
  try {
    // First, save the basic file info to get the media_context_id
    const { data: mediaData, error: mediaError } = await supabase
      .from('media_contexts')
      .insert([
        {
          name: fileName,
          type: 'text/plain',
          size: new Blob([content]).size,
          file_url: null // We'll store content in chunks
        }
      ])
      .select()
      .single();
    
    if (mediaError) {
      throw mediaError;
    }
    
    // Split into chunks
    const chunks = chunkText(content);
    
    // Process each chunk with Gemini
    for (let i = 0; i < chunks.length; i++) {
      await processChunkWithGemini(mediaData.id, i, chunks[i], fileName, geminiApiKey);
      
      // Add a small delay between requests to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return mediaData.id;
    
  } catch (error) {
    console.error('Text processing error:', error);
    throw error;
  }
};

export const analyzeMediaWithGemini = async (
  file: File,
  dataUrl: string,
  geminiApiKey: string
): Promise<void> => {
  try {
    const base64Data = dataUrl.split(',')[1]; // Remove data:mime/type;base64, prefix
    const mimeType = file.type;
    
    const requestBody = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          },
          {
            text: "Analyze this media file and provide: 1) A brief summary of the content, 2) Key insights or information extracted, 3) Suggested tags for categorization, 4) Any notable features or elements that could be useful for context in conversations."
          }
        ]
      }]
    };
    
    const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
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
      const analysis = data.candidates[0].content.parts[0].text;
      
      // Parse the analysis to extract structured data
      const parsedAnalysis = parseGeminiAnalysis(analysis);
      
      // Save to Supabase
      await saveToSupabase(file, parsedAnalysis, dataUrl);
      
    } else {
      throw new Error('Unexpected response format from Gemini API');
    }
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

const saveToSupabase = async (file: File, analysis: any, dataUrl: string) => {
  try {
    // Generate thumbnail URL for images
    let thumbnailUrl = null;
    if (file.type.startsWith('image/')) {
      thumbnailUrl = dataUrl; // Use the data URL as thumbnail for now
    }
    
    const { data, error } = await supabase
      .from('media_contexts')
      .insert([
        {
          name: file.name,
          type: file.type,
          size: file.size,
          thumbnail_url: thumbnailUrl,
          gemini_summary: analysis.summary,
          gemini_key_insights: analysis.keyInsights,
          gemini_suggested_tags: analysis.suggestedTags,
          gemini_notable_features: analysis.notableFeatures,
          file_url: dataUrl // Store the data URL for now
        }
      ])
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log('Saved to Supabase:', data);
  } catch (error) {
    console.error('Supabase Error:', error);
    throw new Error(`Failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};