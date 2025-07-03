const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

export interface DalleImageRequest {
  prompt: string;
  model?: 'dall-e-3' | 'dall-e-2';
  n?: number;
  quality?: 'standard' | 'hd';
  response_format?: 'url' | 'b64_json';
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  style?: 'vivid' | 'natural';
  user?: string;
}

export interface DalleImageResponse {
  created: number;
  data: Array<{
    revised_prompt?: string;
    url?: string;
    b64_json?: string;
  }>;
}

export const generateImageWithDalle = async (
  prompt: string,
  apiKey: string,
  options: Partial<DalleImageRequest> = {}
): Promise<string> => {
  try {
    const requestBody: DalleImageRequest = {
      prompt,
      model: 'dall-e-3',
      n: 1,
      quality: 'standard',
      response_format: 'url',
      size: '1024x1024',
      style: 'vivid',
      ...options
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data: DalleImageResponse = await response.json();
    
    if (!data.data || data.data.length === 0 || !data.data[0].url) {
      throw new Error('No image URL returned from DALL-E API');
    }

    return data.data[0].url;
  } catch (error) {
    console.error('DALL-E API Error:', error);
    throw error;
  }
};

export const generatePromptForMedia = (
  fileName: string,
  summary?: string,
  keyInsights?: string,
  tags?: string
): string => {
  let prompt = `Create a professional, clean thumbnail image representing "${fileName}".`;
  
  if (summary) {
    prompt += ` The content is about: ${summary.substring(0, 200)}.`;
  }
  
  if (keyInsights) {
    prompt += ` Key themes include: ${keyInsights.substring(0, 150)}.`;
  }
  
  if (tags) {
    const tagList = tags.split(/[,;|\n]/).map(tag => tag.trim()).filter(tag => tag.length > 0).slice(0, 5);
    if (tagList.length > 0) {
      prompt += ` Related to: ${tagList.join(', ')}.`;
    }
  }
  
  prompt += ' Style: modern, minimalist, professional, suitable for a document thumbnail. No text overlay.';
  
  // Ensure prompt is within DALL-E 3 limits (4000 characters)
  if (prompt.length > 3900) {
    prompt = prompt.substring(0, 3900) + '...';
  }
  
  return prompt;
};