import { ToolExecutor } from '@clawforge/tool-sdk';
import { z } from 'zod';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public async getPage(): Promise<Page> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    if (!this.context) {
      this.context = await this.browser.newContext();
    }
    if (!this.page) {
      this.page = await this.context.newPage();
    }
    return this.page;
  }

  public async close() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const browserOpenTool: ToolExecutor = {
  definition: {
    name: 'browser.open',
    description: 'Launches a browser session and navigates to the given URL.',
    schema: z.object({
      url: z.string()
    }),
    riskLevel: 'LOW'
  },
  execute: async (params: any) => {
    try {
      const page = await BrowserManager.getInstance().getPage();
      await page.goto(params.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = await page.title();
      return { success: true, url: params.url, title };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};

export const browserNavigateTool: ToolExecutor = {
  definition: {
    name: 'browser.navigate',
    description: 'Navigates to a specific URL in the current browser session.',
    schema: z.object({
      url: z.string()
    }),
    riskLevel: 'SAFE'
  },
  execute: async (params: any) => {
    try {
      const page = await BrowserManager.getInstance().getPage();
      await page.goto(params.url, { waitUntil: 'domcontentloaded' });
      return { success: true, url: params.url };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};

export const browserClickTool: ToolExecutor = {
  definition: {
    name: 'browser.click',
    description: 'Clicks an element matching the selector.',
    schema: z.object({
      selector: z.string()
    }),
    riskLevel: 'LOW'
  },
  execute: async (params: any) => {
    try {
      const page = await BrowserManager.getInstance().getPage();
      await page.click(params.selector);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};

export const browserTypeTool: ToolExecutor = {
  definition: {
    name: 'browser.type',
    description: 'Types text into an element matching the selector.',
    schema: z.object({
      selector: z.string(),
      text: z.string()
    }),
    riskLevel: 'LOW'
  },
  execute: async (params: any) => {
    try {
      const page = await BrowserManager.getInstance().getPage();
      await page.fill(params.selector, params.text);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};

export const browserScrollTool: ToolExecutor = {
  definition: {
    name: 'browser.scroll',
    description: 'Scrolls the current page up or down.',
    schema: z.object({
      direction: z.enum(['up', 'down'])
    }),
    riskLevel: 'SAFE'
  },
  execute: async (params: any) => {
    try {
      const page = await BrowserManager.getInstance().getPage();
      await page.evaluate((dir) => {
        window.scrollBy(0, dir === 'down' ? window.innerHeight : -window.innerHeight);
      }, params.direction);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};

export const browserScreenshotTool: ToolExecutor = {
  definition: {
    name: 'browser.screenshot',
    description: 'Takes a screenshot of the active page and returns a base64 encoded string.',
    schema: z.object({
      path: z.string().optional()
    }),
    riskLevel: 'SAFE'
  },
  execute: async (params: any) => {
    try {
      const page = await BrowserManager.getInstance().getPage();
      const buffer = await page.screenshot({ type: 'png' });
      return {
        success: true,
        base64: buffer.toString('base64')
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};

export const browserExtractTool: ToolExecutor = {
  definition: {
    name: 'browser.extract',
    description: 'Extracts the visible text contents of the active page.',
    schema: z.object({}),
    riskLevel: 'SAFE'
  },
  execute: async () => {
    try {
      const page = await BrowserManager.getInstance().getPage();
      const text = await page.innerText('body');
      return { success: true, text };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};

export async function shutdownBrowser() {
  await BrowserManager.getInstance().close();
}
