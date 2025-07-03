import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the incoming webhook payload
    const payload = await req.json()
    
    console.log('Received webhook payload:', payload)

    // Extract content from the webhook payload
    // Adjust these field names based on your blog app's webhook structure
    const {
      title,
      content,
      summary,
      tags,
      author,
      created_at,
      content_type = 'text/markdown',
      file_size,
      metadata
    } = payload

    // Validate required fields
    if (!title || !content) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: title and content are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate file size if not provided
    const calculatedSize = file_size || new Blob([content]).size

    // Prepare the media context entry
    const mediaEntry = {
      name: title,
      type: content_type,
      size: calculatedSize,
      file_url: null, // We'll store content directly in analysis fields
      thumbnail_url: null,
      gemini_summary: summary || `Auto-imported content: ${title}`,
      gemini_key_insights: metadata?.key_insights || 'Content imported from blog/whitepaper application',
      gemini_suggested_tags: Array.isArray(tags) ? tags.join(', ') : tags || 'imported, blog, content',
      gemini_notable_features: metadata?.notable_features || `Author: ${author || 'Unknown'}, Content Type: ${content_type}`,
      created_at: created_at || new Date().toISOString()
    }

    // Insert into media_contexts table
    const { data: insertedMedia, error: insertError } = await supabaseClient
      .from('media_contexts')
      .insert([mediaEntry])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting media context:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert media context', 
          details: insertError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If content is large, chunk it for analysis
    const shouldChunk = content.length > 10000
    
    if (shouldChunk) {
      const chunks = chunkContent(content, 10000)
      
      // Insert chunks into media_analysis_chunks table
      const chunkEntries = chunks.map((chunk, index) => ({
        media_context_id: insertedMedia.id,
        chunk_index: index,
        chunk_content: chunk.substring(0, 1000) + (chunk.length > 1000 ? '...' : ''), // Preview
        summary: `Chunk ${index + 1} of ${chunks.length}: ${chunk.substring(0, 200)}...`,
        key_insights: extractKeyInsights(chunk),
        suggested_tags: extractTags(chunk),
        notable_features: `Chunk size: ${chunk.length} characters`
      }))

      const { error: chunksError } = await supabaseClient
        .from('media_analysis_chunks')
        .insert(chunkEntries)

      if (chunksError) {
        console.error('Error inserting chunks:', chunksError)
        // Don't fail the whole operation, just log the error
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Content successfully imported',
        media_id: insertedMedia.id,
        chunks_created: shouldChunk ? Math.ceil(content.length / 10000) : 0,
        data: {
          title: insertedMedia.name,
          size: insertedMedia.size,
          type: insertedMedia.type,
          created_at: insertedMedia.created_at
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper function to chunk large content
function chunkContent(content: string, chunkSize: number = 10000): string[] {
  const chunks: string[] = []
  let currentIndex = 0
  
  while (currentIndex < content.length) {
    let endIndex = currentIndex + chunkSize
    
    // Try to break at natural boundaries
    if (endIndex < content.length) {
      // Look for paragraph break first
      const paragraphBreak = content.lastIndexOf('\n\n', endIndex)
      if (paragraphBreak > currentIndex) {
        endIndex = paragraphBreak + 2
      } else {
        // Look for sentence break
        const sentenceBreak = content.lastIndexOf('. ', endIndex)
        if (sentenceBreak > currentIndex) {
          endIndex = sentenceBreak + 2
        } else {
          // Look for word break
          const wordBreak = content.lastIndexOf(' ', endIndex)
          if (wordBreak > currentIndex) {
            endIndex = wordBreak + 1
          }
        }
      }
    }
    
    chunks.push(content.slice(currentIndex, endIndex).trim())
    currentIndex = endIndex
  }
  
  return chunks.filter(chunk => chunk.length > 0)
}

// Helper function to extract key insights from content
function extractKeyInsights(content: string): string {
  // Simple extraction - look for key phrases and important sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const keyPhrases = sentences.filter(sentence => 
    sentence.toLowerCase().includes('important') ||
    sentence.toLowerCase().includes('key') ||
    sentence.toLowerCase().includes('significant') ||
    sentence.toLowerCase().includes('conclusion') ||
    sentence.toLowerCase().includes('result')
  )
  
  return keyPhrases.slice(0, 3).join('. ') || 'No specific key insights identified in this chunk.'
}

// Helper function to extract tags from content
function extractTags(content: string): string {
  const words = content.toLowerCase().match(/\b\w{4,}\b/g) || []
  const wordFreq: { [key: string]: number } = {}
  
  // Count word frequencies
  words.forEach(word => {
    if (!['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    }
  })
  
  // Get top words as tags
  const topWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
  
  return topWords.join(', ') || 'content, imported, text'
}