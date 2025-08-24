/**
 * BatonCore API Type Definitions
 * 
 * This file contains TypeScript interfaces for all API request/response types
 * used by the BatonCore web automation API.
 */

// ===== Core Types =====

export type CommandName = "observe" | "extract" | "act";

export interface PageFunction {
  name: CommandName;
  query: string;
}

// ===== API Request Types =====

export interface ExecuteRequest {
  /** Natural language description of the web automation task to perform */
  prompt: string;
}

export interface HealthRequest {
  // No request body for health check
}

// ===== API Response Types =====

export interface HealthResponse {
  status: "ok";
  message: string;
}

export interface ExecuteSuccessResponse {
  success: true;
  prompt: string;
  result: AutomationResult;
}

export interface ExecuteErrorResponse {
  success: false;
  error: string;
  prompt: string | null;
}

export type ExecuteResponse = ExecuteSuccessResponse | ExecuteErrorResponse;

// ===== Automation Result Types =====

export interface AutomationResult {
  /** Whether the automation task completed successfully */
  success: boolean;
  /** Array of automation steps that were planned and executed */
  plan: PageFunction[];
  /** Array of execution results for each step in the plan */
  outputs: string[];
  /** Array of screenshot file paths captured during execution */
  screenshots: string[];
  /** Final meaningful output extracted from the automation task */
  output?: string;
  /** Error message if the automation failed */
  error?: string;
}

// ===== Internal Types =====

export interface Stagehand {
  observe(query: string): Promise<string>;
  extract(query: string): Promise<string>;
  act(query: string): Promise<string>;
}

export interface PageContent {
  title: string;
  url: string;
  content: string;
}

// ===== Configuration Types =====

export interface ServerConfig {
  port: number;
  openaiApiKey: string;
}

export interface AutomationConfig {
  screenshotDir: string;
  headless: boolean;
  timeout: number;
}

// ===== Utility Types =====

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

export interface ExecutionStep {
  step: PageFunction;
  index: number;
  output: string;
}

// ===== Example Types for Documentation =====

export interface ExamplePrompts {
  googleSearch: string;
  newsExtraction: string;
  wikipediaResearch: string;
  ecommerce: string;
  weatherCheck: string;
  hackerNews: string;
}

export const EXAMPLE_PROMPTS: ExamplePrompts = {
  googleSearch: "Go to Google and search for OpenAI",
  newsExtraction: "Go to CNN and get the top news story",
  wikipediaResearch: "Visit Wikipedia and find a random article about science",
  ecommerce: "Go to Amazon and search for wireless headphones",
  weatherCheck: "Check the weather in New York",
  hackerNews: "Go to Hacker News and get the top 3 stories"
};

// ===== Validation Schemas =====

export interface ValidationRules {
  prompt: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
}

export const VALIDATION_RULES: ValidationRules = {
  prompt: {
    minLength: 1,
    maxLength: 1000,
    required: true
  }
};

// ===== HTTP Status Codes =====

export enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  INTERNAL_SERVER_ERROR = 500
}

// ===== Command Descriptions =====

export interface CommandDescription {
  name: CommandName;
  description: string;
  examples: string[];
}

export const COMMAND_DESCRIPTIONS: CommandDescription[] = [
  {
    name: "act",
    description: "Perform actions on the webpage (navigate, click, type, scroll)",
    examples: [
      "google.com",
      "click the search box",
      "type OpenAI in the search box",
      "press Enter to search",
      "scroll down to see more results"
    ]
  },
  {
    name: "observe", 
    description: "Wait for conditions or check page state",
    examples: [
      "wait until the search results appear",
      "look for the login button",
      "check if a popup is visible",
      "wait for the page to load"
    ]
  },
  {
    name: "extract",
    description: "Get information from the page using AI",
    examples: [
      "get the top news headline",
      "extract the article title",
      "get the current temperature",
      "find the product price"
    ]
  }
];

// ===== Type Guards =====

export function isExecuteSuccessResponse(response: ExecuteResponse): response is ExecuteSuccessResponse {
  return response.success === true;
}

export function isExecuteErrorResponse(response: ExecuteResponse): response is ExecuteErrorResponse {
  return response.success === false;
}

export function isValidCommandName(name: string): name is CommandName {
  return ["observe", "extract", "act"].includes(name);
}

// ===== Default Values =====

export const DEFAULT_CONFIG = {
  port: 3000,
  screenshotDir: "./debug_screenshots",
  headless: true,
  timeout: 30000
} as const;
