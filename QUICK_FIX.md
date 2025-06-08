# Quick Fix for Quote Escaping Errors

If you're seeing errors like `syntax error: Expected end of line but found identifier` when using selectors with quotes, follow these steps:

## 1. Update and Rebuild

```bash
# Navigate to the server directory
cd "/Users/stevenaylward/Desktop/Projects/MCP Servers/mcp-safari-server"

# Pull the latest changes (if using git)
git pull

# Install dependencies (just in case)
npm install

# Build the project
npm run build
```

## 2. Restart Claude

**Important**: Claude caches MCP servers. You must fully restart Claude:

1. Quit Claude completely (Cmd+Q on Mac)
2. Wait a few seconds
3. Restart Claude
4. Try the command again

## 3. Verify the Update

You should now be running version 1.1.0 with the following fixes:
- ✅ Proper quote escaping for complex selectors
- ✅ Enhanced visibility detection
- ✅ Better error messages

## 4. Test It

Try these test commands:

```
Use the safari navigate tool to open https://google.com
Use the safari wait_for_element tool with selector "input[name='q']"
```

The function should now work without syntax errors!

## Still Having Issues?

1. Check that `dist/index.js` exists and has a recent timestamp
2. Ensure your MCP config points to the correct file
3. Try removing the MCP server from Claude's config and re-adding it

## Alternative Temporary Workaround

If you need to use the server immediately while troubleshooting, you can use simpler selectors:
- Instead of: `input[name="q"]`
- Try: `input` or `.search-input` (using class names)