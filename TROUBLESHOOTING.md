# Safari MCP Server - Troubleshooting Guide

## If you're seeing old code being executed after updates:

### 1. Rebuild the Project
```bash
cd "/Users/stevenaylward/Desktop/Projects/MCP Servers/mcp-safari-server"
npm run build
```

### 2. Restart Claude
After making changes to the MCP server:
1. Quit Claude completely (Cmd+Q)
2. Restart Claude
3. The MCP server will be reloaded with the new code

### 3. Check the Built Files
Make sure the TypeScript has been compiled to JavaScript:
```bash
ls -la dist/
# Should show index.js with a recent timestamp
```

### 4. Verify MCP Configuration
Check your Claude configuration file to ensure it's pointing to the correct server:
- For production: Should point to `dist/index.js`
- For development: Should point to `src/index.ts` with tsx

### 5. Clear Any Node Cache
If the issue persists:
```bash
rm -rf node_modules/.cache
npm run build
```

## Testing Complex Selectors

When testing selectors with quotes, ensure proper escaping:

### Good Examples:
- `input[type="text"]` 
- `input[name="q"]`
- `button[data-action="submit"]`

### These selectors are now properly handled by the improved escaping logic.

## Common Issues and Solutions

### Issue: "AppleScript syntax error"
**Cause**: Quote escaping issues in selectors
**Solution**: Update to the latest version and rebuild

### Issue: "Timeout waiting for element" 
**Cause**: Element exists but isn't visible according to the visibility checks
**Solution**: Check the error message for details about display, visibility, and dimensions

### Issue: "Element not found"
**Cause**: Selector doesn't match any element on the page
**Solution**: Verify the selector using browser DevTools first