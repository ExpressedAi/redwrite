# Webhook Receiver Function

This Supabase Edge Function receives webhooks from external applications (like your blog/whitepaper app) and automatically imports content into the ContextFlow media library.

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

4. Deploy the function:
   ```bash
   supabase functions deploy webhook-receiver
   ```

## Webhook URL

After deployment, your webhook URL will be:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook-receiver
```

## Expected Payload Format

The webhook expects a JSON payload with the following structure:

```json
{
  "title": "Your Blog Post Title",
  "content": "The full content of your blog post or whitepaper...",
  "summary": "Optional summary of the content",
  "tags": ["tag1", "tag2", "tag3"] or "tag1, tag2, tag3",
  "author": "Author Name",
  "created_at": "2024-01-15T10:30:00Z",
  "content_type": "text/markdown",
  "file_size": 12345,
  "metadata": {
    "key_insights": "Optional key insights",
    "notable_features": "Optional notable features"
  }
}
```

### Required Fields
- `title`: The title/name of the content
- `content`: The actual content text

### Optional Fields
- `summary`: A brief summary (will be used as gemini_summary)
- `tags`: Array or comma-separated string of tags
- `author`: Author information
- `created_at`: ISO timestamp (defaults to current time)
- `content_type`: MIME type (defaults to "text/markdown")
- `file_size`: Size in bytes (calculated if not provided)
- `metadata`: Additional metadata object

## Features

- **Automatic Content Import**: Receives webhook data and creates media_contexts entries
- **Content Chunking**: Large content (>10,000 characters) is automatically chunked for better analysis
- **Tag Extraction**: Automatically extracts relevant tags from content if not provided
- **Key Insights**: Generates basic key insights from content chunks
- **Error Handling**: Comprehensive error handling with detailed responses
- **CORS Support**: Handles CORS for web-based webhook senders

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "Content successfully imported",
  "media_id": "uuid-of-created-media",
  "chunks_created": 3,
  "data": {
    "title": "Your Blog Post Title",
    "size": 12345,
    "type": "text/markdown",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response (400/500)
```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

## Testing

You can test the webhook using curl:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook-receiver \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "title": "Test Blog Post",
    "content": "This is a test blog post content...",
    "tags": ["test", "blog", "webhook"],
    "author": "Test Author"
  }'
```

## Security

- The function uses the Supabase service role key for database operations
- CORS is configured to allow requests from any origin (adjust as needed)
- Consider adding authentication/authorization if needed for production use

## Integration with Your Blog App

Configure your blog/whitepaper application to send a POST request to the webhook URL with the expected payload format after content creation.