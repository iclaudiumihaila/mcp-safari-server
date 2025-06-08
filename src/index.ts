#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Tool schemas
const NavigateSchema = z.object({
  url: z.string().url().describe('The URL to navigate to'),
});

const ExecuteScriptSchema = z.object({
  script: z.string().describe('JavaScript code to execute in the current page'),
});

const GetPageInfoSchema = z.object({});

const TakeScreenshotSchema = z.object({
  filename: z.string().optional().describe('Filename for the screenshot (optional)'),
});

const GetConsoleLogsSchema = z.object({});

const RefreshPageSchema = z.object({});

const GoBackSchema = z.object({});

const GoForwardSchema = z.object({});

const StartErrorMonitoringSchema = z.object({
  interval: z.number().optional().describe('Check interval in milliseconds (default: 2000)'),
  autoSendToClaude: z.boolean().optional().describe('Automatically send errors to Claude Code (default: true)'),
});

const StopErrorMonitoringSchema = z.object({});

const ClickElementSchema = z.object({
  selector: z.string().describe('CSS selector for the element to click'),
  waitForNavigation: z.boolean().optional().describe('Wait for page navigation after click (default: false)'),
});

const TypeTextSchema = z.object({
  selector: z.string().describe('CSS selector for the input element'),
  text: z.string().describe('Text to type into the element'),
  clearFirst: z.boolean().optional().describe('Clear the input before typing (default: true)'),
});

const ScrollToSchema = z.object({
  selector: z.string().optional().describe('CSS selector to scroll to (optional)'),
  x: z.number().optional().describe('X coordinate to scroll to'),
  y: z.number().optional().describe('Y coordinate to scroll to'),
  behavior: z.enum(['auto', 'smooth']).optional().describe('Scroll behavior (default: auto)'),
});

const SelectOptionSchema = z.object({
  selector: z.string().describe('CSS selector for the select element'),
  value: z.string().optional().describe('Option value to select'),
  text: z.string().optional().describe('Option text to select'),
  index: z.number().optional().describe('Option index to select'),
});

const GetElementTextSchema = z.object({
  selector: z.string().describe('CSS selector for the element'),
});

const WaitForElementSchema = z.object({
  selector: z.string().describe('CSS selector to wait for'),
  timeout: z.number().optional().describe('Maximum time to wait in milliseconds (default: 10000)'),
  visible: z.boolean().optional().describe('Wait for element to be visible (default: true)'),
});

class SafariServer {
  private server: Server;
  private errorMonitoringInterval?: NodeJS.Timeout;
  private lastErrorCount: number = 0;
  private autoSendToClaude: boolean = true;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-safari-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          notifications: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'navigate',
          description: 'Navigate Safari to a specific URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to navigate to',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'execute_script',
          description: 'Execute JavaScript in the current Safari page',
          inputSchema: {
            type: 'object',
            properties: {
              script: {
                type: 'string',
                description: 'JavaScript code to execute',
              },
            },
            required: ['script'],
          },
        },
        {
          name: 'get_page_info',
          description: 'Get information about the current page (URL, title, etc.)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'take_screenshot',
          description: 'Take a screenshot of the current Safari window',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Filename for the screenshot (optional)',
              },
            },
          },
        },
        {
          name: 'get_console_logs',
          description: 'Get console logs from the current page',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'refresh_page',
          description: 'Refresh the current Safari page',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'go_back',
          description: 'Navigate back in Safari history',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'go_forward',
          description: 'Navigate forward in Safari history',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'start_error_monitoring',
          description: 'Start monitoring Safari for JavaScript errors and optionally send them to Claude Code',
          inputSchema: {
            type: 'object',
            properties: {
              interval: {
                type: 'number',
                description: 'Check interval in milliseconds (default: 2000)',
              },
              autoSendToClaude: {
                type: 'boolean',
                description: 'Automatically send errors to Claude Code (default: true)',
              },
            },
          },
        },
        {
          name: 'stop_error_monitoring',
          description: 'Stop monitoring Safari for JavaScript errors',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'click_element',
          description: 'Click on an element in the page using CSS selector',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector for the element to click',
              },
              waitForNavigation: {
                type: 'boolean',
                description: 'Wait for page navigation after click',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'type_text',
          description: 'Type text into an input element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector for the input element',
              },
              text: {
                type: 'string',
                description: 'Text to type into the element',
              },
              clearFirst: {
                type: 'boolean',
                description: 'Clear the input before typing (default: true)',
              },
            },
            required: ['selector', 'text'],
          },
        },
        {
          name: 'scroll_to',
          description: 'Scroll to a specific element or position',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector to scroll to',
              },
              x: {
                type: 'number',
                description: 'X coordinate to scroll to',
              },
              y: {
                type: 'number',
                description: 'Y coordinate to scroll to',
              },
              behavior: {
                type: 'string',
                enum: ['auto', 'smooth'],
                description: 'Scroll behavior',
              },
            },
          },
        },
        {
          name: 'select_option',
          description: 'Select an option from a dropdown',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector for the select element',
              },
              value: {
                type: 'string',
                description: 'Option value to select',
              },
              text: {
                type: 'string',
                description: 'Option text to select',
              },
              index: {
                type: 'number',
                description: 'Option index to select',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'get_element_text',
          description: 'Get the text content of an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector for the element',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'wait_for_element',
          description: 'Wait for an element to appear on the page',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector to wait for',
              },
              timeout: {
                type: 'number',
                description: 'Maximum time to wait in milliseconds',
              },
              visible: {
                type: 'boolean',
                description: 'Wait for element to be visible',
              },
            },
            required: ['selector'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'navigate': {
            const { url } = NavigateSchema.parse(args);
            return await this.navigate(url);
          }
          case 'execute_script': {
            const { script } = ExecuteScriptSchema.parse(args);
            return await this.executeScript(script);
          }
          case 'get_page_info': {
            return await this.getPageInfo();
          }
          case 'take_screenshot': {
            const { filename } = TakeScreenshotSchema.parse(args);
            return await this.takeScreenshot(filename);
          }
          case 'get_console_logs': {
            return await this.getConsoleLogs();
          }
          case 'refresh_page': {
            return await this.refreshPage();
          }
          case 'go_back': {
            return await this.goBack();
          }
          case 'go_forward': {
            return await this.goForward();
          }
          case 'start_error_monitoring': {
            const { interval, autoSendToClaude } = StartErrorMonitoringSchema.parse(args);
            return await this.startErrorMonitoring(interval, autoSendToClaude);
          }
          case 'stop_error_monitoring': {
            return await this.stopErrorMonitoring();
          }
          case 'click_element': {
            const { selector, waitForNavigation } = ClickElementSchema.parse(args);
            return await this.clickElement(selector, waitForNavigation);
          }
          case 'type_text': {
            const { selector, text, clearFirst } = TypeTextSchema.parse(args);
            return await this.typeText(selector, text, clearFirst);
          }
          case 'scroll_to': {
            const { selector, x, y, behavior } = ScrollToSchema.parse(args);
            return await this.scrollTo(selector, x, y, behavior);
          }
          case 'select_option': {
            const { selector, value, text, index } = SelectOptionSchema.parse(args);
            return await this.selectOption(selector, value, text, index);
          }
          case 'get_element_text': {
            const { selector } = GetElementTextSchema.parse(args);
            return await this.getElementText(selector);
          }
          case 'wait_for_element': {
            const { selector, timeout, visible } = WaitForElementSchema.parse(args);
            return await this.waitForElement(selector, timeout, visible);
          }
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  private async navigate(url: string) {
    const script = `
      tell application "Safari"
        activate
        if (count of windows) = 0 then
          make new document
        end if
        set URL of current tab of front window to "${url}"
      end tell
    `;
    
    await this.runAppleScript(script);
    return {
      content: [
        {
          type: 'text',
          text: `Navigated to ${url}`,
        },
      ],
    };
  }

  private async executeScript(jsCode: string) {
    // Escape the JavaScript code for AppleScript
    const escapedCode = jsCode.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    // Wrap the JavaScript to always return something
    const wrappedCode = `
      (function() {
        try {
          var result = (function() { ${escapedCode} })();
          return result !== undefined ? String(result) : 'undefined';
        } catch (e) {
          return 'Error: ' + e.toString();
        }
      })()
    `.replace(/\n/g, '\\n');
    
    const script = `
      tell application "Safari"
        set jsResult to do JavaScript "${wrappedCode}" in current tab of front window
        return jsResult
      end tell
    `;
    
    const result = await this.runAppleScript(script);
    
    // Handle the special case where result is 'undefined'
    if (result === 'undefined') {
      return {
        content: [
          {
            type: 'text',
            text: 'Script executed successfully (returned undefined)',
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: result || 'Script executed successfully',
        },
      ],
    };
  }

  private async getPageInfo() {
    const script = `
      tell application "Safari"
        set pageURL to URL of current tab of front window
        set pageTitle to name of current tab of front window
        set pageSource to source of current tab of front window
        return "URL: " & pageURL & "\\nTitle: " & pageTitle
      end tell
    `;
    
    const result = await this.runAppleScript(script);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  private async takeScreenshot(filename?: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = filename || `/tmp/safari-screenshot-${timestamp}.png`;
    
    try {
      // Method 1: Try to get window bounds and use screencapture with coordinates
      const boundsScript = `
        tell application "System Events"
          tell process "Safari"
            if exists window 1 then
              set theWindow to window 1
              set windowBounds to position of theWindow & size of theWindow
              return (item 1 of windowBounds as string) & "," & (item 2 of windowBounds as string) & "," & (item 1 of size of theWindow as string) & "," & (item 2 of size of theWindow as string)
            else
              return ""
            end if
          end tell
        end tell
      `;
      
      const windowBounds = await this.runAppleScript(boundsScript);
      
      if (windowBounds && windowBounds.includes(',')) {
        // Parse bounds: x,y,width,height
        const [x, y, width, height] = windowBounds.split(',').map(n => parseInt(n.trim()));
        
        // Use screencapture with rectangle coordinates
        await execAsync(`screencapture -x -R${x},${y},${width},${height} "${screenshotPath}"`);
        
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot saved to: ${screenshotPath}`,
            },
          ],
        };
      }
    } catch (error) {
      console.error('Method 1 failed:', error);
    }
    
    try {
      // Method 2: Use window ID for capture
      const windowIdScript = `
        tell application "System Events"
          tell process "Safari"
            if exists window 1 then
              return id of window 1
            else
              return ""
            end if
          end tell
        end tell
      `;
      
      const windowId = await this.runAppleScript(windowIdScript);
      
      if (windowId) {
        // Ensure Safari is in front before capturing
        await this.runAppleScript('tell application "Safari" to activate');
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for window to come forward
        
        // Use window ID for direct capture
        await execAsync(`screencapture -o -l ${windowId} -x "${screenshotPath}"`);
        
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot saved to: ${screenshotPath}`,
            },
          ],
        };
      }
    } catch (error) {
      console.error('Method 2 failed:', error);
    }
    
    try {
      // Method 3: Fullscreen capture as last resort (but still automated)
      const fullscreenScript = `
        tell application "Safari"
          activate
        end tell
        delay 1
        do shell script "screencapture -x '${screenshotPath}'"
      `;
      
      await this.runAppleScript(fullscreenScript);
      
      return {
        content: [
          {
            type: 'text',
            text: `Screenshot saved to: ${screenshotPath} (fullscreen capture)`,
          },
        ],
      };
    } catch (error) {
      console.error('All automated screenshot methods failed:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async getConsoleLogs() {
    // This injects a script to capture console logs
    const script = `
      tell application "Safari"
        set result to do JavaScript "
          (function() {
            if (!window.__mcpConsoleLogs) {
              window.__mcpConsoleLogs = [];
              const originalLog = console.log;
              const originalError = console.error;
              const originalWarn = console.warn;
              
              console.log = function(...args) {
                window.__mcpConsoleLogs.push({type: 'log', message: args.join(' ')});
                originalLog.apply(console, args);
              };
              
              console.error = function(...args) {
                window.__mcpConsoleLogs.push({type: 'error', message: args.join(' ')});
                originalError.apply(console, args);
              };
              
              console.warn = function(...args) {
                window.__mcpConsoleLogs.push({type: 'warn', message: args.join(' ')});
                originalWarn.apply(console, args);
              };
            }
            return JSON.stringify(window.__mcpConsoleLogs);
          })();
        " in current tab of front window
        return result
      end tell
    `;
    
    const result = await this.runAppleScript(script);
    return {
      content: [
        {
          type: 'text',
          text: result || '[]',
        },
      ],
    };
  }

  private async refreshPage() {
    const script = `
      tell application "Safari"
        tell current tab of front window to do JavaScript "location.reload()"
      end tell
    `;
    
    await this.runAppleScript(script);
    return {
      content: [
        {
          type: 'text',
          text: 'Page refreshed',
        },
      ],
    };
  }

  private async goBack() {
    const script = `
      tell application "Safari"
        tell current tab of front window to go back
      end tell
    `;
    
    await this.runAppleScript(script);
    return {
      content: [
        {
          type: 'text',
          text: 'Navigated back',
        },
      ],
    };
  }

  private async goForward() {
    const script = `
      tell application "Safari"
        tell current tab of front window to go forward
      end tell
    `;
    
    await this.runAppleScript(script);
    return {
      content: [
        {
          type: 'text',
          text: 'Navigated forward',
        },
      ],
    };
  }

  private async clickElement(selector: string, waitForNavigation: boolean = false) {
    const escapedSelector = selector.replace(/"/g, '\\"');
    
    const script = `
      function() {
        const element = document.querySelector("${escapedSelector}");
        if (!element) {
          return 'Element not found: ${escapedSelector}';
        }
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Simulate click
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        element.dispatchEvent(event);
        
        return 'Clicked on: ' + element.tagName + (element.className ? '.' + element.className : '') + (element.id ? '#' + element.id : '');
      }
    `;
    
    const result = await this.executeScript(script);
    
    if (waitForNavigation) {
      // Wait a bit for navigation
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return result;
  }

  private async typeText(selector: string, text: string, clearFirst: boolean = true) {
    const escapedSelector = selector.replace(/"/g, '\\"');
    const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    const script = `
      function() {
        const element = document.querySelector("${escapedSelector}");
        if (!element) {
          return 'Element not found: ${escapedSelector}';
        }
        
        // Focus the element
        element.focus();
        
        // Clear if requested
        if (${clearFirst}) {
          element.value = '';
        }
        
        // Type the text
        element.value += "${escapedText}";
        
        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
        
        return 'Typed text into: ' + element.tagName + (element.type ? '[type=' + element.type + ']' : '');
      }
    `;
    
    return await this.executeScript(script);
  }

  private async scrollTo(selector?: string, x?: number, y?: number, behavior: 'auto' | 'smooth' = 'auto') {
    let script: string;
    
    if (selector) {
      const escapedSelector = selector.replace(/"/g, '\\"');
      script = `
        function() {
          const element = document.querySelector("${escapedSelector}");
          if (!element) {
            return 'Element not found: ${escapedSelector}';
          }
          element.scrollIntoView({ behavior: '${behavior}', block: 'center' });
          return 'Scrolled to element: ${escapedSelector}';
        }
      `;
    } else if (x !== undefined || y !== undefined) {
      script = `
        function() {
          window.scrollTo({
            left: ${x || 0},
            top: ${y || 0},
            behavior: '${behavior}'
          });
          return 'Scrolled to position: x=${x || 0}, y=${y || 0}';
        }
      `;
    } else {
      script = `
        function() {
          return 'No scroll target specified';
        }
      `;
    }
    
    return await this.executeScript(script);
  }

  private async selectOption(selector: string, value?: string, text?: string, index?: number) {
    const escapedSelector = selector.replace(/"/g, '\\"');
    
    let selectScript: string;
    
    if (value !== undefined) {
      const escapedValue = value.replace(/"/g, '\\"');
      selectScript = `element.value = "${escapedValue}";`;
    } else if (text !== undefined) {
      const escapedText = text.replace(/"/g, '\\"');
      selectScript = `
        for (let option of element.options) {
          if (option.text === "${escapedText}") {
            element.value = option.value;
            break;
          }
        }
      `;
    } else if (index !== undefined) {
      selectScript = `element.selectedIndex = ${index};`;
    } else {
      selectScript = `return 'No selection criteria provided';`;
    }
    
    const script = `
      function() {
        const element = document.querySelector("${escapedSelector}");
        if (!element || element.tagName !== 'SELECT') {
          return 'Select element not found: ${escapedSelector}';
        }
        
        ${selectScript}
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
        
        return 'Selected option in: ' + element.name || element.id || '${escapedSelector}';
      }
    `;
    
    return await this.executeScript(script);
  }

  private async getElementText(selector: string) {
    const escapedSelector = selector.replace(/"/g, '\\"');
    
    const script = `
      function() {
        const element = document.querySelector("${escapedSelector}");
        if (!element) {
          return 'Element not found: ${escapedSelector}';
        }
        return element.textContent || element.innerText || '';
      }
    `;
    
    return await this.executeScript(script);
  }

  private async waitForElement(selector: string, timeout: number = 10000, visible: boolean = true) {
    const escapedSelector = selector.replace(/"/g, '\\"');
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const checkScript = `
        function() {
          const element = document.querySelector("${escapedSelector}");
          if (!element) return false;
          
          if (${visible}) {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && 
                            rect.top < window.innerHeight && 
                            rect.bottom > 0;
            return isVisible;
          }
          
          return true;
        }
      `;
      
      const result = await this.executeScript(checkScript);
      const found = result.content[0].text === 'true';
      
      if (found) {
        return {
          content: [
            {
              type: 'text',
              text: `Element found: ${selector}`,
            },
          ],
        };
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Timeout waiting for element: ${selector}`
    );
  }

  private async runAppleScript(script: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      if (stderr) {
        console.error('AppleScript error:', stderr);
      }
      return stdout.trim();
    } catch (error) {
      console.error('Error running AppleScript:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `AppleScript execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async startErrorMonitoring(interval: number = 2000, autoSendToClaude: boolean = true) {
    // Stop any existing monitoring
    if (this.errorMonitoringInterval) {
      clearInterval(this.errorMonitoringInterval);
    }

    this.autoSendToClaude = autoSendToClaude;

    // Inject error tracking script
    const initScript = `
      if (!window.__mcpErrorMonitor) {
        window.__mcpErrorMonitor = {
          errors: [],
          listeners: []
        };
        
        // Track unhandled errors
        window.addEventListener('error', function(e) {
          window.__mcpErrorMonitor.errors.push({
            type: 'error',
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            stack: e.error ? e.error.stack : 'No stack trace',
            timestamp: new Date().toISOString()
          });
        });
        
        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', function(e) {
          window.__mcpErrorMonitor.errors.push({
            type: 'unhandledRejection',
            reason: e.reason ? e.reason.toString() : 'Unknown',
            message: e.reason && e.reason.message ? e.reason.message : e.reason,
            stack: e.reason && e.reason.stack ? e.reason.stack : 'No stack trace',
            timestamp: new Date().toISOString()
          });
        });
        
        // Also monitor console.error calls
        const originalError = console.error;
        console.error = function(...args) {
          window.__mcpErrorMonitor.errors.push({
            type: 'console.error',
            message: args.join(' '),
            timestamp: new Date().toISOString()
          });
          originalError.apply(console, args);
        };
      }
      'Error monitoring initialized';
    `;

    await this.executeScript(initScript);

    // Start monitoring interval
    this.errorMonitoringInterval = setInterval(async () => {
      try {
        await this.checkForErrors();
      } catch (error) {
        console.error('Error checking for browser errors:', error);
      }
    }, interval);

    return {
      content: [
        {
          type: 'text',
          text: `Error monitoring started with ${interval}ms interval. Auto-send to Claude: ${autoSendToClaude}`,
        },
      ],
    };
  }

  private async stopErrorMonitoring() {
    if (this.errorMonitoringInterval) {
      clearInterval(this.errorMonitoringInterval);
      this.errorMonitoringInterval = undefined;
    }

    // Clear error tracking in browser
    try {
      await this.executeScript('window.__mcpErrorMonitor = null;');
    } catch (error) {
      // Ignore errors when clearing
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Error monitoring stopped',
        },
      ],
    };
  }

  private async checkForErrors() {
    const checkScript = `
      if (window.__mcpErrorMonitor && window.__mcpErrorMonitor.errors.length > 0) {
        const errors = window.__mcpErrorMonitor.errors;
        window.__mcpErrorMonitor.errors = [];
        return JSON.stringify(errors);
      }
      return '[]';
    `;

    const result = await this.executeScript(checkScript);
    
    try {
      const errors = JSON.parse(result.content[0].text);
      
      if (errors.length > 0 && this.autoSendToClaude) {
        // Check if Claude Code is active
        const isClaudeActive = await this.isClaudeCodeActive();
        
        if (isClaudeActive) {
          // Send notification about errors
          await this.sendErrorNotification(errors);
        }
      }
    } catch (error) {
      console.error('Error parsing error data:', error);
    }
  }

  private async isClaudeCodeActive(): Promise<boolean> {
    try {
      // Check if claude process is running
      const { stdout } = await execAsync('pgrep -f "claude" || true');
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  private async sendErrorNotification(errors: any[]) {
    // Format errors for notification
    const errorSummary = errors.map(err => {
      return `[${err.type}] ${err.message}${err.filename ? ` at ${err.filename}:${err.lineno}:${err.colno}` : ''}`;
    }).join('\n');

    const pageInfo = await this.getPageInfo();
    const pageUrl = pageInfo.content[0].text.split('\n')[0].replace('URL: ', '');

    // Send notification to Claude
    try {
      await this.server.notification({
        method: 'notifications/errors',
        params: {
          errors: errors,
          pageUrl: pageUrl,
          summary: `Found ${errors.length} error(s) on ${pageUrl}:\n${errorSummary}`,
          timestamp: new Date().toISOString()
        }
      });

      console.error(`Sent ${errors.length} error(s) to Claude Code`);
    } catch (error) {
      console.error('Failed to send error notification:', error);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Safari MCP server running on stdio');
  }
}

const server = new SafariServer();
server.run().catch(console.error);