// page-navigator.ts (ESM-safe, Playwright JPG screenshots)
//
// A TypeScript module that uses the OpenAI Node SDK with tool calling to
// plan and execute atomic web navigation steps via a Stagehand-like tool
// interface exposing `observe`, `extract`, and `act`.
//
// NEW:
// - After each executed step, ONE screenshot (JPG) is saved to a directory (default: ./debug_screenshots).
// - Screenshots are taken with the Playwright API from a provided Page.
//
// Usage:
//   1) npm i openai dotenv playwright
//   2) export OPENAI_API_KEY=... (or set it on Windows)
//   3) Run with ESM:  npx tsx page-navigator.ts "your task"
//      or ts-node --esm page-navigator.ts "your task"
//      or compile to ESM and `node dist/page-navigator.js`
//
// How to wire screenshots:
//   - Create a Playwright Page and pass it into PageNavigator via the `page` option.
//   - The same Page should ideally be used by your Stagehand implementation.
//
// Exports:
//   - PageFunction, Stagehand, PageNavigator, navigate()

import OpenAI from "openai";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import * as fs from "node:fs/promises";
import dotenv from "dotenv";
import { chromium, Page } from "playwright"; // <-- Playwright for screenshots
dotenv.config();

// ----------------------------- Types & Interfaces -----------------------------

export type CommandName = "observe" | "extract" | "act";

export interface PageFunction {
  name: CommandName;
  query: string;
}

/** The core Stagehand tool surface (as provided). */
export interface Stagehand {
  /** Identify & analyze elements, return a description or JSON of elements found */
  observe(query: string): Promise<string>;
  /** Extract content from the current page, return the extracted string */
  extract(query: string): Promise<string>;
  /** Perform an action on the page, return a short status string */
  act(query: string): Promise<string>;
}

// ----------------------------- Tool Definitions ------------------------------

function stagehandTools() {
  const toolParams = {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description:
          "A natural language instruction describing what to do, using human-readable terms like 'login button' instead of CSS selectors.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  };

  return [
    {
      type: "function" as const,
      function: {
        name: "observe",
        description:
          "Look for elements or wait for conditions using natural language (e.g., 'wait until the search results appear', 'look for the login button'). NO CSS selectors or IDs.",
        parameters: toolParams,
      },
    },
    {
      type: "function" as const,
      function: {
        name: "extract",
        description:
          "Get information from the page using natural language descriptions (e.g., 'get the order status', 'extract the product title'). NO CSS selectors or IDs.",
        parameters: toolParams,
      },
    },
    {
      type: "function" as const,
      function: {
        name: "act",
        description:
          "Perform actions using natural language (e.g., 'click the login button', 'type email address', 'scroll down'). NO CSS selectors or IDs.",
        parameters: toolParams,
      },
    },
  ];
}

/** Schema tool that forces the model to return a valid plan with only the 3 commands. */
function finalizePlanTool() {
  return {
    type: "function" as const,
    function: {
      name: "finalize_plan",
      description:
        "Return the final plan as an array of steps. Each step must be one of {observe, extract, act}.",
      parameters: {
        type: "object",
        properties: {
          plan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", enum: ["observe", "extract", "act"] },
                query: { type: "string" },
              },
              required: ["name", "query"],
              additionalProperties: false,
            },
          },
        },
        required: ["plan"],
        additionalProperties: false,
      },
    },
  };
}

// ------------------------------ Planner Prompt -------------------------------

function plannerSystemPrompt() {
  return `
You are an AI Brain that converts user requests into natural language web automation steps.

IMPORTANT: You must produce json. The words "json" and "JSON" both refer to the same thing here.
Your responses must be valid json when asked to provide the final plan.

TOOLS:
- observe(query): Look for elements or wait for page conditions using NATURAL LANGUAGE
  (e.g., "wait until the search results appear", "look for the login button")
- extract(query): Get text or information using NATURAL LANGUAGE descriptions
  (e.g., "get the order status text", "extract the product title")
- act(query): Perform actions using NATURAL LANGUAGE instructions
  (e.g., "click the login button", "type my email address", "scroll down to see more")

CRITICAL RULES FOR NATURAL LANGUAGE:
1) NEVER use CSS selectors, IDs, or technical terms (no #, ., div, span, etc.)
2) Use human-readable descriptions: "login button" not "#login-btn"
3) Describe elements by their visible text or purpose: "search box", "submit button", "order history link"
4) Use natural actions: "click", "type", "scroll", "look for"
5) For navigation, use simple format: "google.com" or "amazon.com" (not "navigate to google.com")
6) Be conversational but specific: "click the blue login button" or "find the order tracking section"

PLANNING STRATEGY:
1) Break down the user's request into logical steps a human would take
2) Start with navigation if needed: "google.com" or "amazon.com" (simple domain format)
3) Handle authentication: "look for login button", "click login", "enter credentials"
4) Navigate to the specific section: "find my orders section", "click on order history"
5) Extract the needed information: "get the status of the most recent order"

COMMON PATTERNS:
- For login: "amazon.com" → "click login button" → "enter email" → "enter password" → "click sign in"
- For orders: "navigate to orders page" → "look for recent orders" → "extract order status"
- For search: "find search box" → "type search term" → "click search" → "look at results"

WHEN READY:
- Call the tool "finalize_plan" exactly once with the full plan as json: { "plan": [...] }.
`.trim();
}

function plannerUserPrompt(task: string) {
  return `
User Request: "${task}"

Convert this user request into a step-by-step plan using NATURAL LANGUAGE instructions.

Think like a human user describing what they would do:
- Instead of "click #login-btn" → use "click the login button"
- Instead of "input[name='email']" → use "type email in the email field"
- Instead of "div.order-status" → use "find the order status information"
- For navigation, use simple domains: "google.com", "amazon.com" (not "navigate to...")

Create a plan with natural, conversational instructions that describe what a person would do.
Each step should use only {observe, extract, act} with human-readable queries.

Examples of good natural language queries:
- "google.com" (for navigation)
- "look for the sign in button"
- "click the login button"
- "type email address in the email field"
- "find my recent orders"
- "get the tracking information for the latest order"

When ready, call "finalize_plan" with json: { "plan": [ { "name": "...", "query": "..." } ] }.
Return json only.
`.trim();
}

// ------------------------------ Utility Helpers ------------------------------

/** Try hard to parse a JSON object from the model's final message (fallback if finalize_plan isn't used). */
function safeParsePlan(content: string): { plan: PageFunction[] } {
  const tryDirect = () => JSON.parse(content);

  const tryFence = () => {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match?.[1]) return JSON.parse(match[1]);
    throw new Error("No JSON code fence found.");
  };

  try {
    return tryDirect();
  } catch {
    return tryFence();
  }
}

/** Normalize synonyms in 'name' defensively (e.g., "wait until" → observe). */
function normalizeCommandName(name: string): CommandName | null {
  const n = name.toLowerCase().trim();
  if (n === "observe" || n === "extract" || n === "act") return n as CommandName;

  if (/^wait/.test(n) || /(ensure|verify|check|confirm)/.test(n)) return "observe";
  if (/(click|type|press|navigate|open|select|submit|scroll|hover)/.test(n)) return "act";
  if (/(read|get|scrape|capture|grab|copy|extract)/.test(n)) return "extract";

  return null;
}

/** Validate plan structure and coerce names to the allowed union if needed. */
function validatePlan(raw: unknown): PageFunction[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as any).plan)) {
    throw new Error("Model did not return an object with a 'plan' array.");
  }
  const plan = (raw as any).plan.map((step: any, idx: number) => {
    if (!step || typeof step !== "object")
      throw new Error(`Plan step ${idx} is not an object.`);
    let { name, query } = step;
    if (!query || typeof query !== "string") {
      throw new Error(`Plan step ${idx} must include a string 'query'.`);
    }
    if (name !== "observe" && name !== "extract" && name !== "act") {
      const norm = typeof name === "string" ? normalizeCommandName(name) : null;
      if (!norm) {
        throw new Error(
          `Plan step ${idx} has invalid name '${name}'. Must be one of: observe | extract | act.`
        );
      }
      name = norm;
    }
    return { name, query } as PageFunction;
  });
  return plan;
}

/** Simple slug for filenames from queries. */
function slugify(input: string, maxLen = 60) {
  return input
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
}

/** Zero-padded integer for filenames. */
function z(n: number, width = 2) {
  return n.toString().padStart(width, "0");
}

// ------------------------------- PageNavigator --------------------------------

export class PageNavigator {
  private client: OpenAI;
  private model: string;
  private stagehand: Stagehand;
  private page: Page; // Playwright Page used for JPG screenshots
  private screenshotDir: string;

  constructor(opts: {
    client: OpenAI;
    stagehand: Stagehand;
    page: Page; // REQUIRED for screenshots via Playwright
    model?: string;
    /** Directory to save screenshots (default: './debug_screenshots'). */
    screenshotDir?: string;
  }) {
    this.client = opts.client;
    this.stagehand = opts.stagehand;
    this.page = opts.page;
    this.model = opts.model ?? "gpt-5";
    this.screenshotDir = opts.screenshotDir ?? "./debug_screenshots";
  }

  /**
   * Build a plan (list of PageFunctions) for the given task, allowing the model
   * to use Stagehand tools while planning. The plan is schema-clamped via the
   * "finalize_plan" tool to ensure valid command names.
   */
  async plan(task: string): Promise<PageFunction[]> {
    const tools: any[] = [...stagehandTools(), finalizePlanTool()];

    const messages: any[] = [
      { role: "system", content: plannerSystemPrompt() },
      { role: "user", content: plannerUserPrompt(task) },
    ];

    // Cache of tool results keyed by "name::query" to reduce duplicate read calls.
    const cache = new Map<string, string>();
    // If we performed an act, the page likely changed -> clear cache before the next read.
    let clearCacheBeforeNextRead = false;

    for (let iter = 0; iter < 16; iter++) {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools,
        tool_choice: "auto",
        response_format: { type: "json_object" },
        temperature: 1,
      });

      const msg = completion.choices[0]?.message;
      if (!msg) throw new Error("No completion message returned.");

      const toolCalls = msg.tool_calls ?? [];
      if (toolCalls.length > 0) {
        messages.push({
          role: "assistant",
          tool_calls: toolCalls.map((tc: any) => ({
            id: tc.id!,
            type: "function",
            function: tc.function!,
          })),
        });

        for (const tc of toolCalls) {
          const fnName = tc.function?.name as string | undefined;
          const args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};

          // Finalize path: the model returns the plan via the tool.
          if (fnName === "finalize_plan") {
            const plan = validatePlan(args); // args expected to be { plan: [...] }
            // Echo a tool response (not strictly required, but consistent).
            messages.push({
              role: "tool",
              tool_call_id: tc.id!,
              name: "finalize_plan",
              content: JSON.stringify({ status: "received" }),
            });
            return plan;
          }

          // Stagehand tool path:
          const validName = (fnName ?? "").toLowerCase();
          if (!["observe", "extract", "act"].includes(validName)) {
            messages.push({
              role: "tool",
              tool_call_id: tc.id!,
              name: fnName ?? "unknown",
              content: `{"error":"Unknown tool '${fnName}'."}`,
            });
            continue;
          }

          const query: string = args.query ?? "";
          const key = `${validName}::${query}`;

          // Clear cache at first read after an act:
          if ((validName === "observe" || validName === "extract") && clearCacheBeforeNextRead) {
            cache.clear();
            clearCacheBeforeNextRead = false;
          }

          // Serve cached reads if available:
          if ((validName === "observe" || validName === "extract") && cache.has(key)) {
            messages.push({
              role: "tool",
              tool_call_id: tc.id!,
              name: validName,
              content: cache.get(key)!,
            });
            continue;
          }

          const result = await this.invokeStagehand(validName as CommandName, query);

          // Update cache & flags
          if (validName === "act") {
            clearCacheBeforeNextRead = true;
          } else {
            cache.set(key, result);
          }

          messages.push({
            role: "tool",
            tool_call_id: tc.id!,
            name: validName,
            content: result,
          });
        }

        continue; // Let the model incorporate tool results.
      }

      // Fallback path: if the model didn't call finalize_plan, try to parse content.
      if (typeof msg.content === "string" && msg.content.trim().length > 0) {
        const parsed = safeParsePlan(msg.content);
        const plan = validatePlan(parsed);
        return plan;
      } else {
        messages.push({ role: "assistant", content: msg.content ?? "" });
      }
    }

    throw new Error("Planning loop exceeded iteration limit without a final plan.");
  }

  /** Execute PageFunctions in-order using the Stagehand adapter. Saves ONE JPG screenshot after each step. */
  async execute(plan: PageFunction[]): Promise<string[]> {
    const outputs: string[] = [];
    await fs.mkdir(this.screenshotDir, { recursive: true });

    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];

      const res = await this.invokeStagehand(step.name, step.query);
      outputs.push(res);

      // Capture exactly ONE screenshot AFTER executing each step (JPG)
      const saved = await this.captureStepScreenshot(i + 1, step);
      if (saved) {
        console.log(`[trace] Saved screenshot: ${saved}`);
      }
    }
    return outputs;
  }

  /** Convenience: plan, then execute. */
  async navigate(task: string): Promise<{ plan: PageFunction[]; outputs: string[] }> {
    const plan = await this.plan(task);
    const outputs = await this.execute(plan);
    return { plan, outputs };
  }

  // --------------------------- Internal Utilities ---------------------------

  private async invokeStagehand(name: CommandName, query: string): Promise<string> {
    try {
      switch (name) {
        case "observe":
          return await this.stagehand.observe(query);
        case "extract":
          return await this.stagehand.extract(query);
        case "act":
          return await this.stagehand.act(query);
        default:
          // Should not happen due to typing + validation.
          return `{"error":"Unknown command '${name}'."}`;
      }
    } catch (err) {
      return JSON.stringify({
        error: (err as Error).message || String(err),
      });
    }
  }

  private async captureStepScreenshot(stepIndex: number, step: PageFunction): Promise<string | null> {
    try {
      const fname = `${z(stepIndex, 2)}-${step.name}-${slugify(step.query)}.jpg`;
      const fpath = join(this.screenshotDir, fname);
      await this.page.screenshot({
        path: fpath,
        type: "jpeg",
        quality: 80,
        fullPage: true,
      });
      return fpath;
    } catch (err) {
      console.warn(
        `[trace] Failed to capture screenshot for step ${stepIndex} (${step.name}):`,
        (err as Error).message || String(err)
      );
      return null;
    }
  }
}

// ------------------------------ Public Helper --------------------------------

/**
 * One-shot helper if you don't want to manage the class.
 * Returns the final plan and the execution outputs.
 */
export async function navigate(
  task: string,
  client: OpenAI,
  stagehand: Stagehand,
  page: Page,
  model: string = "gpt-5",
  screenshotDir?: string
) {
  const nav = new PageNavigator({ client, stagehand, model, page, screenshotDir });
  return await nav.navigate(task);
}

// ------------------------------- Demo (Optional) ------------------------------
// ESM-safe "main module" guard:
const __THIS_FILE__ = resolve(fileURLToPath(import.meta.url));
const __ENTRY__ = process.argv[1] ? resolve(process.argv[1]) : "";
const IS_MAIN = __THIS_FILE__ === __ENTRY__;

if (IS_MAIN) {
  (async () => {
    const task =
      process.argv.slice(2).join(" ").trim() ||
      "Search for 'NYTimes Technology', open the first result, and read the top headline text.";

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Launch a Playwright browser so screenshots work out-of-the-box in the demo.
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Minimal Stagehand that actually uses Playwright to make the demo meaningful.
    const stagehand: Stagehand = {
      async observe(query) {
        console.log("[observe]", query);
        // VERY MINIMAL heuristics just for demo; adapt to your real Stagehand.
        if (/wait until .*visible/i.test(query)) {
          // naive wait: ensure DOM is ready
          await page.waitForLoadState("domcontentloaded");
          return `Waited for condition: ${query}`;
        }
        if (/first search result/i.test(query)) {
          const first = page.locator("a h3").first();
          const text = (await first.count()) ? await first.innerText().catch(() => "") : "";
          return `First result heading: ${text || "(not found)"}`;
        }
        return `Observed: ${query}`;
      },
      async extract(query) {
        console.log("[extract]", query);
        
        try {
          // Get the full page content - both visible text and some structure
          const pageContent = await this.getIntelligentPageContent(page);
          
          // Use GPT to intelligently extract what the user wants
          const extractedContent = await this.intelligentExtract(query, pageContent);
          
          return extractedContent;
        } catch (err) {
          console.error("Intelligent extraction failed:", err);
          return `EXTRACTED("${query}") => "(extraction failed: ${err.message})"`;
        }
      },
      
      // Helper method to get intelligent page content
      async getIntelligentPageContent(page) {
        try {
          // Get the page title
          const title = await page.title().catch(() => "");
          
          // Get main content areas - prioritize article content, main sections
          const contentSelectors = [
            'main',
            'article', 
            '[role="main"]',
            '.content',
            '#content',
            '.article-content',
            '.post-content',
            'body'
          ];
          
          let mainContent = "";
          for (const selector of contentSelectors) {
            const element = page.locator(selector).first();
            if (await element.count()) {
              const text = await element.innerText().catch(() => "");
              if (text && text.length > 100) {
                mainContent = text;
                break;
              }
            }
          }
          
          // If no main content found, get body text
          if (!mainContent) {
            mainContent = await page.locator('body').innerText().catch(() => "");
          }
          
          // Clean up the content - remove excessive whitespace, limit length
          mainContent = mainContent
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim()
            .substring(0, 8000); // Limit to ~8k chars to stay within token limits
          
          return {
            title,
            url: page.url(),
            content: mainContent
          };
        } catch (err) {
          throw new Error(`Failed to get page content: ${err.message}`);
        }
      },
      
      // Helper method to use GPT for intelligent extraction
      async intelligentExtract(query, pageData) {
        try {
          const extractionPrompt = `
You are an intelligent web content extractor. The user wants to extract specific information from a webpage.

USER REQUEST: "${query}"

WEBPAGE DATA:
Title: ${pageData.title}
URL: ${pageData.url}
Content: ${pageData.content}

INSTRUCTIONS:
1. Analyze the user's request and understand what they want to extract
2. Look through the webpage content to find the most relevant information
3. Extract and summarize the requested information clearly and concisely
4. If the exact information isn't found, provide the closest relevant content
5. Keep your response focused and under 200 words

RESPONSE FORMAT:
Provide a clear, direct answer to what the user requested. Don't include meta-commentary about the extraction process.
`;

          const completion = await client.chat.completions.create({
            model: "gpt-4o-mini", // Use faster, cheaper model for extraction
            messages: [
              { role: "system", content: "You are a helpful web content extraction assistant. Provide clear, concise answers based on the webpage content provided." },
              { role: "user", content: extractionPrompt }
            ],
            temperature: 0.3,
            max_tokens: 300
          });

          const result = completion.choices[0]?.message?.content || "No content extracted";
          return result.trim();
        } catch (err) {
          throw new Error(`GPT extraction failed: ${err.message}`);
        }
      },
      async act(query) {
        console.log("[act]", query);
        // navigate to 'URL' - handle various formats
        const navMatch = query.match(/navigate to ['"]([^'"]+)['"]/i) || 
                        query.match(/navigate to\s+(\S+)/i) ||
                        query.match(/^go to\s+(\S+)/i) ||
                        query.match(/^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i) || // Handle domains like "google.com", "en.wikipedia.org"
                        query.match(/^(https?:\/\/\S+)/i); // Handle full URLs
        
        if (navMatch) {
          let url = navMatch[1];
          // Add protocol if missing
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          await page.goto(url, { waitUntil: "domcontentloaded" });
          return `NAVIGATED(${url})`;
        }
        // type 'text' into search box
        const typeMatch = query.match(/type ['"]([^'"]+)['"] into search box/i);
        if (typeMatch) {
          await page.fill('input[name="q"]', typeMatch[1]).catch(() => {});
          return `TYPED(${typeMatch[1]})`;
        }
        // click search button (try Enter first for reliability)
        if (/click search button/i.test(query)) {
          const q = page.locator('input[name="q"]');
          if (await q.count()) {
            await q.press("Enter").catch(() => {});
            return "PRESSED_ENTER";
          }
          // fallback: try clicking btnK if visible
          const btn = page.locator('input[name="btnK"]');
          if (await btn.isVisible().catch(() => false)) {
            await btn.click().catch(() => {});
            return "CLICKED_BTNK";
          }
          return "SEARCH_TRIGGERED";
        }
        // click on 'Link Text' link
        const clickText = query.match(/click on ['"]([^'"]+)['"] link/i);
        if (clickText) {
          const text = clickText[1];
          const link = page.locator(`a:has-text("${text}")`).first();
          if (await link.count()) {
            await link.click().catch(() => {});
            return `CLICKED_LINK_TEXT(${text})`;
          }
          // fallback: click first result
          const first = page.locator("a h3").first();
          if (await first.count()) {
            await first.click().catch(() => {});
            return "CLICKED_FIRST_RESULT";
          }
          return "LINK_NOT_FOUND";
        }
        return `ACTION_OK("${query}")`;
      },
    };

    try {
      const nav = new PageNavigator({
        client,
        stagehand,
        page,
        screenshotDir: "./debug_screenshots", // JPGs will be written here
      });
      const { plan, outputs } = await nav.navigate(task);

      console.log("\n--- PLAN -----------------------------");
      console.log(JSON.stringify({ plan }, null, 2));
      console.log("\n--- EXECUTION OUTPUTS ---------------");
      outputs.forEach((o, i) => console.log(`${z(i + 1, 2)}. ${o}`));
      console.log("-------------------------------------\n");
    } catch (err) {
      console.error("Navigation error:", err);
      process.exitCode = 1;
    } finally {
      await page.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  })();
}
