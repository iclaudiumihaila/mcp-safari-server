# MCP Safari Server

A Model Context Protocol (MCP) server that provides programmatic control of Safari browser on macOS. Perfect for web automation, testing, and debugging with AI assistants like Claude.

## Overview

The Safari MCP Server enables AI assistants to interact with Safari browser through a standardized protocol. It provides tools for navigation, element interaction, JavaScript execution, and page monitoring, making it ideal for:

- 🤖 AI-assisted web development and debugging
- 🧪 Automated testing and QA
- 📊 Web scraping and data extraction
- 🔍 Real-time error monitoring
- 📸 Visual regression testing

## Features

- **Navigate**: Open URLs in Safari
- **Execute JavaScript**: Run JS code in the current page context
- **Get Page Info**: Retrieve current URL and page title
- **Take Screenshots**: Capture the current Safari window
- **Console Logs**: Capture and retrieve console.log, console.error, and console.warn messages
- **Page Navigation**: Refresh, go back, or go forward in browser history
- **Automatic Error Monitoring**: Monitor JavaScript errors and send them to Claude Code for immediate fixing
- **Click Elements**: Click on page elements using CSS selectors
- **Type Text**: Fill in forms and input fields
- **Scroll**: Scroll to specific elements or positions
- **Select Options**: Choose options from dropdown menus
- **Get Element Text**: Extract text content from page elements
- **Wait for Elements**: Wait for elements to appear before interacting

## Installation

1. Install dependencies:
```bash
cd mcp-safari-server
npm install
```

2. Build the server:
```bash
npm run build
```

## Configuration

Add this server to your Claude configuration file (`.mcp.json` or `claude-code-config.json`):

```json
{
  "mcpServers": {
    "safari": {
      "command": "node",
      "args": ["/path/to/mcp-safari-server/dist/index.js"],
      "env": {}
    }
  }
}
```

Or for development:
```json
{
  "mcpServers": {
    "safari": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-safari-server/src/index.ts"],
      "env": {}
    }
  }
}
```

## Usage

Once configured, Claude can use the following tools:

### navigate
Navigate Safari to a URL:
```
Use the safari navigate tool to open https://example.com
```

### execute_script
Execute JavaScript in the current page:
```
Use the safari execute_script tool to run: document.querySelector('h1').textContent
```

### get_page_info
Get information about the current page:
```
Use the safari get_page_info tool to see the current URL and title
```

### take_screenshot
Take a screenshot of the current Safari window:
```
Use the safari take_screenshot tool to capture the current page
```

### get_console_logs
Retrieve console logs from the page:
```
Use the safari get_console_logs tool to see any console messages
```

### refresh_page
Refresh the current page:
```
Use the safari refresh_page tool
```

### go_back / go_forward
Navigate through browser history:
```
Use the safari go_back tool to go to the previous page
```

### start_error_monitoring
Start monitoring JavaScript errors and automatically send them to Claude Code:
```
Use the safari start_error_monitoring tool
```

Options:
- `interval`: Check interval in milliseconds (default: 2000)
- `autoSendToClaude`: Automatically send errors to Claude Code (default: true)

### stop_error_monitoring
Stop error monitoring:
```
Use the safari stop_error_monitoring tool
```

### click_element
Click on an element in the page:
```
Use the safari click_element tool with selector "#submit-button"
Use the safari click_element tool with selector "a.nav-link" and waitForNavigation true
```

### type_text
Type text into an input field:
```
Use the safari type_text tool with selector "#email" and text "user@example.com"
Use the safari type_text tool with selector "#password" and text "mypassword" and clearFirst false
```

### scroll_to
Scroll to an element or position:
```
Use the safari scroll_to tool with selector "#footer"
Use the safari scroll_to tool with y 500 and behavior "smooth"
```

### select_option
Select an option from a dropdown:
```
Use the safari select_option tool with selector "#country" and value "US"
Use the safari select_option tool with selector "#size" and text "Large"
Use the safari select_option tool with selector "#priority" and index 2
```

### get_element_text
Get the text content of an element:
```
Use the safari get_element_text tool with selector "h1"
Use the safari get_element_text tool with selector ".error-message"
```

### wait_for_element
Wait for an element to appear:
```
Use the safari wait_for_element tool with selector "#loading-complete"
Use the safari wait_for_element tool with selector ".modal" and timeout 5000

## Error Monitoring Feature

The Safari MCP server can automatically monitor JavaScript errors in your web application and send them to Claude Code for immediate fixing. This creates a powerful development workflow where:

1. You develop your web app
2. Safari MCP monitors for JavaScript errors
3. When errors occur, they're automatically sent to Claude Code
4. Claude can analyze the errors and suggest or implement fixes

### How Error Monitoring Works

When you start error monitoring, the server:

1. Injects JavaScript into the Safari page to capture:
   - Unhandled errors (window.onerror)
   - Unhandled promise rejections
   - Console.error calls

2. Checks for new errors at the specified interval (default: every 2 seconds)

3. If errors are found and Claude Code is active, sends a notification containing:
   - Error type and message
   - File location and line/column numbers
   - Stack traces
   - Current page URL
   - Timestamp

4. Claude Code receives the notification and can prompt you to fix the errors

### Example Workflow

1. Start your development server
2. Navigate to your app in Safari using the `navigate` tool
3. Start error monitoring with `start_error_monitoring`
4. As you interact with your app, any JavaScript errors will be captured
5. Claude Code will receive notifications about errors and can help fix them
6. Stop monitoring with `stop_error_monitoring` when done

## Requirements

- macOS (uses AppleScript to control Safari)
- Safari browser
- Node.js 16+

## Security Note

This server executes AppleScript commands to control Safari. Only use it in trusted environments and be careful with the JavaScript code you execute.

## Troubleshooting

1. **Safari automation permission**: You may need to grant Terminal/your IDE permission to control Safari in System Preferences > Security & Privacy > Privacy > Automation.

2. **Script execution errors**: Check that Safari is installed and not blocked by any security software.

3. **Console log capture**: The console log capture feature injects a script into the page. Some pages with strict Content Security Policies might block this.