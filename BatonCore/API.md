# BatonCore API Documentation

BatonCore provides a REST API for AI-powered web automation. Send natural language prompts and get structured automation results.

## Quick Start

1. **Start the server:**
   ```bash
   npm run server
   ```

2. **Test the API:**
   ```bash
   npm run test-api
   ```

## API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "BatonCore API is running"
}
```

### Execute Web Automation
```
POST /api/execute
```

**Request Body:**
```json
{
  "prompt": "Go to Google and search for OpenAI"
}
```

**Response:**
```json
{
  "success": true,
  "prompt": "Go to Google and search for OpenAI",
  "result": {
    "success": true,
    "plan": [
      {
        "name": "act",
        "query": "google.com"
      },
      {
        "name": "observe", 
        "query": "look for the search box on the Google homepage"
      },
      {
        "name": "act",
        "query": "click the search box"
      }
    ],
    "outputs": [
      "NAVIGATED(https://google.com)",
      "Observed: look for the search box on the Google homepage",
      "ACTION_OK(\"click the search box\")"
    ],
    "screenshots": [
      "debug_screenshots/01-*.jpg",
      "debug_screenshots/02-*.jpg"
    ]
  }
}
```

## Example Prompts

### Web Search
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Search Google for TypeScript tutorials"}'
```

### News Extraction
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Go to CNN and get the top news story"}'
```

### Wikipedia Research
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Visit Wikipedia and find a random article about science"}'
```

### E-commerce
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Go to Amazon and search for wireless headphones"}'
```

## Response Format

### Success Response
```json
{
  "success": true,
  "prompt": "user's original prompt",
  "result": {
    "success": true,
    "plan": [/* array of automation steps */],
    "outputs": [/* array of execution results */], 
    "screenshots": [/* array of screenshot paths */]
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "error message",
  "prompt": "user's original prompt"
}
```

## Plan Steps

Each plan contains an array of steps with:

- **`name`**: Action type (`"act"`, `"observe"`, `"extract"`)
- **`query`**: Natural language instruction

### Action Types

- **`act`**: Perform actions (navigate, click, type, scroll)
- **`observe`**: Wait for conditions or check page state  
- **`extract`**: Get information from the page using AI

## Features

✅ **Natural Language Processing** - Send human-readable automation requests  
✅ **AI-Powered Planning** - Automatically breaks down complex tasks  
✅ **Intelligent Extraction** - Uses GPT to understand and extract page content  
✅ **Screenshot Debugging** - Captures screenshots at each step  
✅ **Error Handling** - Graceful error responses with details  
✅ **Modular Architecture** - Clean separation between API and automation logic  

## Environment Variables

Required environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000  # Optional, defaults to 3000
```

## Architecture

- **`server.ts`** - Express.js API server
- **`web-automation.ts`** - Core automation logic (modularized from ctl.ts)
- **`ctl.ts`** - Original PageNavigator implementation
- **`test-client.ts`** - API testing client

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run server

# Test the API
npm run test-api

# Run original CLI version
npm run startctl "your prompt here"
```
