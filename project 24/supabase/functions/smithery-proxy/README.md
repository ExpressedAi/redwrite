# Smithery Proxy Edge Function

This Supabase Edge Function acts as a secure proxy for Smithery API calls, allowing your frontend application to interact with Smithery services without exposing API keys.

## Deployment

To deploy this function to your Supabase project:

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Set the Smithery API key as an environment variable in your Supabase project:
   - Go to your Supabase dashboard
   - Navigate to Settings > Edge Functions
   - Add environment variable: `SMITHERY_API_KEY` with your Smithery API key

5. Deploy the function:
   ```bash
   supabase functions deploy smithery-proxy
   ```

## Function URL

After deployment, your function URL will be:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/smithery-proxy
```

## Available Actions

The proxy supports the following actions:

### Create Task
```javascript
const response = await fetch(functionUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'createTask',
    title: 'My Task',
    description: 'Task description',
    priority: 'high', // 'low', 'medium', 'high'
    tags: ['tag1', 'tag2'],
    dueDate: '2024-12-31T23:59:59Z'
  })
})
```

### Get Task
```javascript
const response = await fetch(functionUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'getTask',
    taskId: 'task-uuid'
  })
})
```

### List Tasks
```javascript
const response = await fetch(functionUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'listTasks',
    status: 'pending', // optional filter
    priority: 'high', // optional filter
    limit: 20,
    offset: 0
  })
})
```

### Update Task
```javascript
const response = await fetch(functionUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'updateTask',
    taskId: 'task-uuid',
    title: 'Updated Title',
    status: 'completed',
    priority: 'medium'
  })
})
```

### Delete Task
```javascript
const response = await fetch(functionUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'deleteTask',
    taskId: 'task-uuid'
  })
})
```

### Execute Task
```javascript
const response = await fetch(functionUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'executeTask',
    taskId: 'task-uuid',
    executionParams: {
      // Any parameters needed for task execution
    }
  })
})
```

### Get Task Status
```javascript
const response = await fetch(functionUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'getTaskStatus',
    taskId: 'task-uuid'
  })
})
```

## Environment Variables

The function requires the following environment variable:

- `SMITHERY_API_KEY`: Your Smithery API key

## Error Handling

The function returns standardized error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

## CORS Support

The function includes full CORS support for web applications, allowing requests from any origin.

## Security

- API keys are stored securely as environment variables
- All requests are proxied through Supabase Edge Functions
- No sensitive information is exposed to the frontend

## Testing

You can test the function using curl:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/smithery-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createTask",
    "title": "Test Task",
    "description": "This is a test task"
  }'
```