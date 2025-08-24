import OpenAI from "openai";
import { chromium, Page } from "playwright";
import dotenv from "dotenv";

dotenv.config();

// Re-export types from ctl.ts
export type CommandName = "observe" | "extract" | "act";

export interface PageFunction {
  name: CommandName;
  query: string;
}

export interface Stagehand {
  observe(query: string): Promise<string>;
  extract(query: string): Promise<string>;
  act(query: string): Promise<string>;
}

export interface AutomationResult {
  success: boolean;
  plan: PageFunction[];
  outputs: string[];
  screenshots: string[];
  output?: string; // Final meaningful output from extraction steps
  error?: string;
}

/**
 * Main function to execute web automation tasks
 * Takes a natural language prompt and returns structured results
 */
export async function executeWebTask(userPrompt: string): Promise<AutomationResult> {
  let browser;
  let page: Page;
  
  try {
    // Initialize OpenAI client
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    // Launch browser
    console.log("🌐 Launching browser...");
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // Create Stagehand implementation
    const stagehand = createStagehandImplementation(page, client);

    // Import PageNavigator from ctl.ts
    const { PageNavigator } = await import('./ctl.js');
    
    // Create navigator and execute task
    console.log("🧠 Creating execution plan...");
    const navigator = new PageNavigator({
      client,
      stagehand,
      page,
      screenshotDir: "./debug_screenshots"
    });

    const { plan, outputs } = await navigator.navigate(userPrompt);
    
    // Get list of screenshot files (simplified)
    const screenshots = plan.map((_, i) => `debug_screenshots/${String(i + 1).padStart(2, '0')}-*.jpg`);

    // Extract the final meaningful output from extraction steps
    const finalOutput = extractFinalOutput(plan, outputs);

    console.log("✅ Task completed successfully!");
    
    return {
      success: true,
      plan,
      outputs,
      screenshots,
      output: finalOutput
    };

  } catch (error) {
    console.error("❌ Automation failed:", error);
    
    return {
      success: false,
      plan: [],
      outputs: [],
      screenshots: [],
      output: undefined,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    // Cleanup
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Create a Stagehand implementation with intelligent extraction
 */
function createStagehandImplementation(page: Page, client: OpenAI): Stagehand {
  return {
    async observe(query: string): Promise<string> {
      console.log("[observe]", query);
      
      // Handle wait conditions
      if (/wait until.*visible/i.test(query)) {
        await page.waitForLoadState("domcontentloaded");
        return `Waited for condition: ${query}`;
      }
      
      // Handle search result observations
      if (/first search result/i.test(query)) {
        const first = page.locator("a h3").first();
        const text = (await first.count()) ? await first.innerText().catch(() => "") : "";
        return `First result heading: ${text || "(not found)"}`;
      }
      
      return `Observed: ${query}`;
    },

    async extract(query: string): Promise<string> {
      console.log("[extract]", query);
      
      try {
        // Get intelligent page content
        const pageContent = await getIntelligentPageContent(page);
        
        // Use GPT to extract what the user wants
        const extractedContent = await intelligentExtract(query, pageContent, client);
        
        return extractedContent;
      } catch (err) {
        console.error("Intelligent extraction failed:", err);
        return `EXTRACTED("${query}") => "(extraction failed: ${err.message})"`;
      }
    },

    async act(query: string): Promise<string> {
      console.log("[act]", query);
      
      // Handle navigation
      const navMatch = query.match(/navigate to ['"]([^'"]+)['"]/i) || 
                      query.match(/navigate to\s+(\S+)/i) ||
                      query.match(/^go to\s+(\S+)/i) ||
                      query.match(/^([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i) ||
                      query.match(/^(https?:\/\/\S+)/i);
      
      if (navMatch) {
        let url = navMatch[1];
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        await page.goto(url, { waitUntil: "domcontentloaded" });
        return `NAVIGATED(${url})`;
      }

      // Handle typing
      const typeMatch = query.match(/type ['"]([^'"]+)['"] into search box/i);
      if (typeMatch) {
        await page.fill('input[name="q"]', typeMatch[1]).catch(() => {});
        return `TYPED(${typeMatch[1]})`;
      }

      // Handle search button clicks
      if (/click search button/i.test(query)) {
        const q = page.locator('input[name="q"]');
        if (await q.count()) {
          await q.press("Enter").catch(() => {});
          return "PRESSED_ENTER";
        }
        const btn = page.locator('input[name="btnK"]');
        if (await btn.isVisible().catch(() => false)) {
          await btn.click().catch(() => {});
          return "CLICKED_BTNK";
        }
        return "SEARCH_TRIGGERED";
      }

      // Handle link clicks
      const clickText = query.match(/click on ['"]([^'"]+)['"] link/i);
      if (clickText) {
        const text = clickText[1];
        const link = page.locator(`a:has-text("${text}")`).first();
        if (await link.count()) {
          await link.click().catch(() => {});
          return `CLICKED_LINK_TEXT(${text})`;
        }
        const first = page.locator("a h3").first();
        if (await first.count()) {
          await first.click().catch(() => {});
          return "CLICKED_FIRST_RESULT";
        }
        return "LINK_NOT_FOUND";
      }

      return `ACTION_OK("${query}")`;
    }
  };
}

/**
 * Get intelligent page content for GPT analysis
 */
async function getIntelligentPageContent(page: Page) {
  try {
    const title = await page.title().catch(() => "");
    
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
    
    if (!mainContent) {
      mainContent = await page.locator('body').innerText().catch(() => "");
    }
    
    mainContent = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
      .substring(0, 8000);
    
    return {
      title,
      url: page.url(),
      content: mainContent
    };
  } catch (err) {
    throw new Error(`Failed to get page content: ${err.message}`);
  }
}

/**
 * Extract the final meaningful output from the automation results
 */
function extractFinalOutput(plan: PageFunction[], outputs: string[]): string {
  // Find the last extract step and its corresponding output
  const extractSteps = plan
    .map((step, index) => ({ step, index, output: outputs[index] }))
    .filter(item => item.step.name === "extract")
    .reverse(); // Get most recent extracts first

  if (extractSteps.length > 0) {
    // Return the most recent extraction result
    const lastExtract = extractSteps[0];
    
    // Clean up the output - remove technical prefixes
    let cleanOutput = lastExtract.output;
    
    // Remove common technical prefixes
    cleanOutput = cleanOutput
      .replace(/^EXTRACTED\([^)]+\)\s*=>\s*/, '')
      .replace(/^Found text content:\s*/, '')
      .replace(/^Headline:\s*/, '')
      .replace(/^Current temperature:\s*/, '')
      .replace(/^High\/Low temperatures:\s*/, '')
      .trim();
    
    // If it's still meaningful content, return it
    if (cleanOutput && cleanOutput.length > 10 && !cleanOutput.includes('(not found')) {
      return cleanOutput;
    }
  }

  // Fallback: look for any meaningful navigation or action results
  const meaningfulOutputs = outputs.filter(output => 
    output.includes('NAVIGATED(') || 
    (output.length > 20 && !output.includes('ACTION_OK') && !output.includes('Observed:'))
  );

  if (meaningfulOutputs.length > 0) {
    return meaningfulOutputs[meaningfulOutputs.length - 1];
  }

  // Final fallback
  return "Task completed successfully - no specific content extracted";
}

/**
 * Use GPT for intelligent content extraction
 */
async function intelligentExtract(query: string, pageData: any, client: OpenAI): Promise<string> {
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
      model: "gpt-4o-mini",
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
}
