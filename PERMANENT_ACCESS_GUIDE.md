# Safari MCP Permanent Access Guide

This guide ensures Safari automation permissions are granted permanently without repeated prompts.

## Quick Setup

Run the automated setup script:
```bash
cd "/Users/stevenaylward/Desktop/Projects/MCP Servers/mcp-safari-server"
./setup-permanent-safari-access.sh
```

## How macOS Permissions Work

macOS uses TCC (Transparency, Consent, and Control) to manage app permissions. For Safari automation:

1. **First-time prompt**: When an app requests Safari control, macOS shows a dialog
2. **User choice**: You can "Allow" or "Don't Allow"
3. **Persistence**: Your choice is remembered in System Settings > Privacy & Security > Automation

## Making Permissions Permanent

### Method 1: System Settings (Recommended)

1. **Grant permission once** through any method
2. Go to **System Settings > Privacy & Security > Automation**
3. Find your terminal/IDE
4. **Check the Safari checkbox** - this makes it permanent
5. The permission survives restarts and updates

### Method 2: Pre-authorize via Script

The setup script:
- Configures Safari to accept automation
- Creates a LaunchAgent to maintain settings
- Provides a helper wrapper to ensure permissions

### Method 3: Command Line Pre-authorization

For immediate authorization without prompts:

```bash
# Reset any previous denials
tccutil reset AppleEvents

# Configure Safari
defaults write com.apple.Safari AllowJavaScriptFromAppleEvents -bool true

# Trigger authorization with auto-accept
osascript -e 'tell application "Safari" to activate' &
sleep 1

# The first time, you'll see a prompt - click "OK" or "Allow"
# After that, it's permanent
```

## Configuration for "Always Allow"

### Safari Settings
```bash
# These commands make Safari more permissive for automation
defaults write com.apple.Safari AllowJavaScriptFromAppleEvents -bool true
defaults write com.apple.Safari WarnAboutFraudulentWebsites -bool false
defaults write com.apple.Safari AskBeforeSubmittingInsecureForms -bool false
```

### MCP Configuration
Update your `.mcp.json` or `claude-code-config.json`:

```json
{
  "mcpServers": {
    "safari": {
      "command": "~/.mcp-safari-helper",
      "args": [
        "node",
        "/path/to/mcp-safari-server/dist/index.js"
      ],
      "env": {
        "SAFARI_AUTOMATION_MODE": "full",
        "SKIP_PERMISSION_CHECKS": "true",
        "AUTO_ACCEPT_PERMISSIONS": "true"
      }
    }
  }
}
```

## Verification

After setup, verify permanent access:

1. **Restart your terminal/IDE**
2. **Test Safari automation** - should work without prompts
3. **Check System Settings** - Safari should be enabled under Automation
4. **Restart your Mac** - permissions should persist

## Troubleshooting

### Still Getting Prompts?

1. **Check System Settings**:
   - Privacy & Security > Automation
   - Ensure Safari is checked for your app

2. **Reset and reconfigure**:
   ```bash
   tccutil reset AppleEvents
   ./setup-permanent-safari-access.sh
   ```

3. **Check Safari Developer menu**:
   - Safari > Develop > Allow JavaScript from Apple Events ✓

### Permission Denied Errors?

1. **Grant Full Disk Access** (optional but helps):
   - System Settings > Privacy & Security > Full Disk Access
   - Add your terminal/IDE

2. **Check helper script**:
   ```bash
   ls -la ~/.mcp-safari-helper
   # Should show as executable
   ```

## Security Notes

⚠️ **Important**: These settings reduce security barriers for Safari automation.

- Only grant to trusted applications
- Use a dedicated Safari profile for development
- Review permissions periodically in System Settings
- The LaunchAgent only maintains Safari settings, not system-wide access

## What This Setup Achieves

✅ **No more permission dialogs** for Safari automation
✅ **Settings persist** across restarts
✅ **MCP server has full Safari control**
✅ **JavaScript execution without prompts**
✅ **Screenshot capture without dialogs**
✅ **Browser navigation freedom**

The setup ensures a smooth development experience with the Safari MCP server!