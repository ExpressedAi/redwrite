import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Get Firecrawl API key from environment
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { action, ...params } = await req.json()

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let response: Response

    switch (action) {
      case 'extract':
        response = await handleExtract(firecrawlApiKey, params)
        break
      case 'getExtractStatus':
        response = await handleGetExtractStatus(firecrawlApiKey, params)
        break
      case 'scrape':
        response = await handleScrape(firecrawlApiKey, params)
        break
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Add CORS headers to the response
    const responseData = await response.json()
    return new Response(
      JSON.stringify(responseData),
      {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Firecrawl proxy error:', error)
    
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

async function handleExtract(apiKey: string, params: any) {
  const { urls, prompt, enableWebSearch, agent } = params

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    throw new Error('URLs array is required')
  }

  if (!prompt) {
    throw new Error('Prompt is required')
  }

  const requestBody: any = {
    urls,
    prompt,
    enableWebSearch: enableWebSearch || false
  }

  if (agent) {
    requestBody.agent = agent
  }

  const response = await fetch('https://api.firecrawl.dev/v1/extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Firecrawl API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}

async function handleGetExtractStatus(apiKey: string, params: any) {
  const { jobId } = params

  if (!jobId) {
    throw new Error('Job ID is required')
  }

  const response = await fetch(`https://api.firecrawl.dev/v1/extract/${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Firecrawl API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}

async function handleScrape(apiKey: string, params: any) {
  const { url, formats, includeTags, excludeTags, onlyMainContent } = params

  if (!url) {
    throw new Error('URL is required')
  }

  const requestBody: any = {
    url,
    formats: formats || ['markdown'],
    includeTags: includeTags || [],
    excludeTags: excludeTags || [],
    onlyMainContent: onlyMainContent !== false
  }

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Firecrawl API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}