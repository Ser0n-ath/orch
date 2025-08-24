# BatonCore API Schema

## Overview
BatonCore provides a REST API for AI-powered web automation. The API converts natural language prompts into structured web automation tasks.

**Base URL:** `http://localhost:3000`

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the API server is running and healthy.

#### Response
```json
{
  "status": "ok",
  "message": "BatonCore API is running"
}
```

**Status Codes:**
- `200 OK` - Server is healthy

---

### 2. Execute Web Automation

**POST** `/api/execute`

Execute a web automation task based on a natural language prompt.

#### Request Body
```json
{
  "prompt": "string" // Required: Natural language description of the task
}
```

#### Request Examples

**Google Search:**
```json
{
  "prompt": "Go to Google and search for OpenAI"
}
```

**News Extraction:**
```json
{
  "prompt": "Go to CNN and get the top news story"
}
```

**Wikipedia Research:**
```json
{
  "prompt": "Visit Wikipedia and find a random article about science"
}
```

**E-commerce:**
```json
{
  "prompt": "Go to Amazon and search for wireless headphones"
}
```

#### Success Response (200 OK)
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
      },
      {
        "name": "act",
        "query": "type OpenAI in the search box"
      },
      {
        "name": "act",
        "query": "press Enter to search"
      },
      {
        "name": "observe",
        "query": "wait until the search results page loads"
      }
    ],
    "outputs": [
      "NAVIGATED(https://google.com)",
      "Observed: look for the search box on the Google homepage",
      "ACTION_OK(\"click the search box\")",
      "ACTION_OK(\"type OpenAI in the search box\")",
      "ACTION_OK(\"press Enter to search\")",
      "Waited for condition: wait until the search results page loads"
    ],
    "screenshots": [
      "debug_screenshots/01-*.jpg",
      "debug_screenshots/02-*.jpg",
      "debug_screenshots/03-*.jpg",
      "debug_screenshots/04-*.jpg",
      "debug_screenshots/05-*.jpg",
      "debug_screenshots/06-*.jpg"
    ],
    "output": "Search results for OpenAI displayed successfully"
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Missing or invalid prompt. Please provide a string prompt in the request body.",
  "prompt": null
}
```

#### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "error": "OPENAI_API_KEY environment variable is required",
  "prompt": "Go to Google and search for OpenAI"
}
```

---

## Data Types

### ExecuteRequest
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | ✅ | Natural language description of the web automation task (1-1000 characters) |

### ExecuteSuccessResponse
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | ✅ | Always `true` for success responses |
| `prompt` | string | ✅ | The original prompt that was executed |
| `result` | AutomationResult | ✅ | Detailed automation execution results |

### ExecuteErrorResponse
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | ✅ | Always `false` for error responses |
| `error` | string | ✅ | Error message describing what went wrong |
| `prompt` | string? | ❌ | The original prompt (if provided) |

### AutomationResult
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | ✅ | Whether the automation task completed successfully |
| `plan` | PageFunction[] | ✅ | Array of automation steps that were planned and executed |
| `outputs` | string[] | ✅ | Array of execution results for each step |
| `screenshots` | string[] | ✅ | Array of screenshot file paths captured during execution |
| `output` | string? | ❌ | Final meaningful output extracted from the task |
| `error` | string? | ❌ | Error message if the automation failed |

### PageFunction
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | CommandName | ✅ | Type of automation step |
| `query` | string | ✅ | Natural language instruction for this step |

### CommandName
Enum values:
- `"act"` - Perform actions (navigate, click, type, scroll)
- `"observe"` - Wait for conditions or check page state
- `"extract"` - Get information from the page using AI

---

## Example Curl Commands

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

### Basic Search
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Go to Google and search for TypeScript"}'
```

### News Extraction
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Go to Hacker News and get the top story title"}'
```

### Weather Check
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Check the weather in New York"}'
```

---

## Response Flow

1. **Request Processing**: API receives natural language prompt
2. **AI Planning**: GPT creates step-by-step automation plan
3. **Browser Execution**: Playwright executes each step with screenshots
4. **Content Extraction**: AI extracts meaningful information from pages
5. **Response**: Structured results with plan, outputs, screenshots, and final output

---

## Error Handling

The API provides detailed error responses for common issues:

- **400 Bad Request**: Missing or invalid prompt
- **500 Internal Server Error**: Missing API keys, browser failures, network issues

All errors include descriptive messages to help with debugging.

---

## Environment Variables

Required for operation:
- `OPENAI_API_KEY` - OpenAI API key for AI planning and extraction
- `PORT` - Server port (optional, defaults to 3000)

---

## Rate Limits

Currently no rate limits are enforced, but each automation task:
- Takes 10-30 seconds to complete
- Uses browser resources
- Makes OpenAI API calls
- Generates screenshot files

Consider implementing rate limiting for production use.
