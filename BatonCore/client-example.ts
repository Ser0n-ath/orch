/**
 * BatonCore API Client Example
 * 
 * This file demonstrates how to interact with the BatonCore API
 * using TypeScript with proper type safety.
 */

import fetch from 'node-fetch';
import { 
  ExecuteRequest, 
  ExecuteResponse, 
  HealthResponse,
  isExecuteSuccessResponse,
  EXAMPLE_PROMPTS 
} from './types.js';

class BatonCoreClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the API server is healthy
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as HealthResponse;
  }

  /**
   * Execute a web automation task
   */
  async execute(prompt: string): Promise<ExecuteResponse> {
    const request: ExecuteRequest = { prompt };
    
    const response = await fetch(`${this.baseUrl}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    const data = await response.json() as ExecuteResponse;
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return data;
  }

  /**
   * Execute automation and return only the final output
   */
  async executeAndGetOutput(prompt: string): Promise<string> {
    const response = await this.execute(prompt);
    
    if (isExecuteSuccessResponse(response)) {
      return response.result.output || 'Task completed successfully';
    } else {
      throw new Error(response.error);
    }
  }

  /**
   * Execute automation with detailed logging
   */
  async executeWithLogging(prompt: string): Promise<ExecuteResponse> {
    console.log(`🚀 Executing: "${prompt}"`);
    const startTime = Date.now();
    
    try {
      const response = await this.execute(prompt);
      const duration = Date.now() - startTime;
      
      if (isExecuteSuccessResponse(response)) {
        console.log(`✅ Success (${duration}ms)`);
        console.log(`📋 Plan: ${response.result.plan.length} steps`);
        console.log(`📊 Outputs: ${response.result.outputs.length} results`);
        console.log(`📸 Screenshots: ${response.result.screenshots.length} files`);
        
        if (response.result.output) {
          console.log(`🎯 Final Output: ${response.result.output}`);
        }
        
        // Log plan preview
        console.log('📝 Plan Preview:');
        response.result.plan.slice(0, 3).forEach((step, idx) => {
          console.log(`   ${idx + 1}. ${step.name.toUpperCase()}: "${step.query}"`);
        });
        if (response.result.plan.length > 3) {
          console.log(`   ... and ${response.result.plan.length - 3} more steps`);
        }
      } else {
        console.log(`❌ Failed (${duration}ms): ${response.error}`);
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`💥 Error (${duration}ms):`, error);
      throw error;
    }
  }
}

// ===== Usage Examples =====

async function runExamples() {
  const client = new BatonCoreClient();

  try {
    // Health check
    console.log('🏥 Checking API health...');
    const health = await client.healthCheck();
    console.log('✅ API is healthy:', health.message);

    // Example 1: Simple execution
    console.log('\n📝 Example 1: Simple Google Search');
    const simpleResult = await client.execute(EXAMPLE_PROMPTS.googleSearch);
    console.log('Result:', simpleResult.success ? '✅ Success' : '❌ Failed');

    // Example 2: Get output only
    console.log('\n📝 Example 2: Get Final Output Only');
    try {
      const output = await client.executeAndGetOutput(EXAMPLE_PROMPTS.hackerNews);
      console.log('Final Output:', output);
    } catch (error) {
      console.error('Failed to get output:', error);
    }

    // Example 3: Detailed logging
    console.log('\n📝 Example 3: Detailed Execution Logging');
    await client.executeWithLogging(EXAMPLE_PROMPTS.newsExtraction);

    // Example 4: Multiple tasks
    console.log('\n📝 Example 4: Multiple Tasks');
    const tasks = [
      EXAMPLE_PROMPTS.wikipediaResearch,
      EXAMPLE_PROMPTS.weatherCheck
    ];

    for (const task of tasks) {
      console.log(`\n🔄 Executing: "${task}"`);
      const result = await client.execute(task);
      
      if (isExecuteSuccessResponse(result)) {
        console.log(`✅ Completed with ${result.result.plan.length} steps`);
        if (result.result.output) {
          console.log(`📄 Output: ${result.result.output.substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    }

  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// ===== Utility Functions =====

/**
 * Validate a prompt before sending to API
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt must be a non-empty string' };
  }
  
  if (prompt.length < 1) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }
  
  if (prompt.length > 1000) {
    return { valid: false, error: 'Prompt cannot exceed 1000 characters' };
  }
  
  return { valid: true };
}

/**
 * Format automation results for display
 */
export function formatResults(response: ExecuteResponse): string {
  if (!isExecuteSuccessResponse(response)) {
    return `❌ Error: ${response.error}`;
  }

  const { result } = response;
  let output = `✅ Success: ${result.plan.length} steps executed\n`;
  
  if (result.output) {
    output += `📄 Final Output: ${result.output}\n`;
  }
  
  output += `📸 Screenshots: ${result.screenshots.length} files\n`;
  output += `📋 Plan:\n`;
  
  result.plan.forEach((step, idx) => {
    output += `  ${idx + 1}. ${step.name.toUpperCase()}: ${step.query}\n`;
  });
  
  return output;
}

// Export the client class and utility functions
export { BatonCoreClient, runExamples };

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
