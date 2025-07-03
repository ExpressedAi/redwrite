import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Smithery API key from environment
    const smitheryApiKey = Deno.env.get('SMITHERY_API_KEY')
    if (!smitheryApiKey) {
      return new Response(
        JSON.stringify({ error: 'Smithery API key not configured' }),
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
      case 'createTask':
        response = await handleCreateTask(smitheryApiKey, params)
        break
      case 'getTask':
        response = await handleGetTask(smitheryApiKey, params)
        break
      case 'listTasks':
        response = await handleListTasks(smitheryApiKey, params)
        break
      case 'updateTask':
        response = await handleUpdateTask(smitheryApiKey, params)
        break
      case 'deleteTask':
        response = await handleDeleteTask(smitheryApiKey, params)
        break
      case 'executeTask':
        response = await handleExecuteTask(smitheryApiKey, params)
        break
      case 'getTaskStatus':
        response = await handleGetTaskStatus(smitheryApiKey, params)
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
    console.error('Smithery proxy error:', error)
    
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

async function handleCreateTask(apiKey: string, params: any) {
  const { title, description, priority = 'medium', tags = [], dueDate } = params

  if (!title) {
    throw new Error('Task title is required')
  }

  const requestBody: any = {
    title,
    description: description || '',
    priority,
    tags: Array.isArray(tags) ? tags : [],
    status: 'pending'
  }

  if (dueDate) {
    requestBody.dueDate = dueDate
  }

  const response = await fetch('https://server.smithery.ai/api/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Smithery API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}

async function handleGetTask(apiKey: string, params: any) {
  const { taskId } = params

  if (!taskId) {
    throw new Error('Task ID is required')
  }

  const response = await fetch(`https://server.smithery.ai/api/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Smithery API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}

async function handleListTasks(apiKey: string, params: any) {
  const { status, priority, limit = 50, offset = 0 } = params

  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  })

  if (status) {
    queryParams.append('status', status)
  }

  if (priority) {
    queryParams.append('priority', priority)
  }

  const response = await fetch(`https://server.smithery.ai/api/tasks?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Smithery API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}

async function handleUpdateTask(apiKey: string, params: any) {
  const { taskId, title, description, priority, status, tags, dueDate } = params

  if (!taskId) {
    throw new Error('Task ID is required')
  }

  const requestBody: any = {}

  if (title !== undefined) requestBody.title = title
  if (description !== undefined) requestBody.description = description
  if (priority !== undefined) requestBody.priority = priority
  if (status !== undefined) requestBody.status = status
  if (tags !== undefined) requestBody.tags = Array.isArray(tags) ? tags : []
  if (dueDate !== undefined) requestBody.dueDate = dueDate

  const response = await fetch(`https://server.smithery.ai/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Smithery API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}

async function handleDeleteTask(apiKey: string, params: any) {
  const { taskId } = params

  if (!taskId) {
    throw new Error('Task ID is required')
  }

  const response = await fetch(`https://server.smithery.ai/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Smithery API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}

async function handleExecuteTask(apiKey: string, params: any) {
  const { taskId, executionParams = {} } = params

  if (!taskId) {
    throw new Error('Task ID is required')
  }

  const requestBody = {
    action: 'execute',
    parameters: executionParams
  }

  const response = await fetch(`https://server.smithery.ai/api/tasks/${taskId}/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Smithery API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}

async function handleGetTaskStatus(apiKey: string, params: any) {
  const { taskId } = params

  if (!taskId) {
    throw new Error('Task ID is required')
  }

  const response = await fetch(`https://server.smithery.ai/api/tasks/${taskId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Smithery API error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return response
}