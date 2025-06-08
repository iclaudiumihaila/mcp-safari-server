# Full Safari Access Setup for MCP Server

This guide will help you configure your Mac to give the Safari MCP server full control without requiring repeated permissions.

## Prerequisites

- macOS (tested on macOS 13+ Ventura or later)
- Safari browser
- Administrator access to your Mac

## Step 1: System Privacy & Security Settings

### Enable Safari Automation

1. Open **System Settings** (Apple menu > System Settings)
2. Navigate to **Privacy & Security** > **Automation**
3. Find your terminal application (Terminal, iTerm2, or your IDE like VS Code)
4. Enable the checkbox for **Safari**
5. If Claude Code is listed separately, enable Safari access for it too

### Enable Developer Mode in Safari

1. Open **Safari**
2. Go to **Safari** menu > **Settings** (or Preferences)
3. Click **Advanced** tab
4. Check **"Show features for web developers"**
5. Now you'll see a **Developer** menu in Safari's menu bar

### Allow JavaScript from Apple Events

1. In Safari **Settings** > **Security** tab
2. Ensure **"Enable JavaScript"** is checked
3. In the **Developer** menu > **Allow JavaScript from Apple Events**
4. This allows AppleScript to execute JavaScript without prompts

## Step 2: Terminal/IDE Full Disk Access (Optional but Recommended)

For maximum automation capabilities:

1. System Settings > **Privacy & Security** > **Full Disk Access**
2. Click the lock and authenticate
3. Add your terminal app or IDE using the + button
4. This prevents any file access restrictions

## Step 3: Disable Safari Security Prompts for Development

### For Development Only - Create a Safari Profile

1. Open Safari
2. Go to **Safari** > **Settings** > **Profiles**
3. Create a new profile called "Development"
4. Use this profile when working with the MCP server

### In your Development Profile:

1. **Settings** > **Security**:
   - Uncheck "Warn when visiting a fraudulent website"
   - Uncheck "Enable JavaScript" warnings

2. **Settings** > **Privacy**:
   - Website tracking: Set to "Allow"
   - Hide IP address: Uncheck
   - This ensures no privacy prompts interrupt automation

3. **Settings** > **Websites**:
   - Set all permissions to "Allow" for localhost and your dev domains

## Step 4: Configure AppleScript Permissions

Run this command in Terminal to ensure AppleScript has full Safari access:

```bash
# Grant Terminal/IDE permission to control Safari via AppleScript
osascript -e 'tell application "Safari" to activate' 2>/dev/null || true

# If prompted, click "OK" to grant permission
```

## Step 5: Enhanced MCP Server Configuration

Update your MCP configuration to use enhanced permissions:

```json
{
  "mcpServers": {
    "safari": {
      "command": "node",
      "args": ["/path/to/mcp-safari-server/dist/index.js"],
      "env": {
        "SAFARI_AUTOMATION_MODE": "full",
        "SKIP_PERMISSION_CHECKS": "true"
      }
    }
  }
}
```

## Step 6: Test Full Access

After setup, test the server has full access:

1. Restart Claude Code
2. Try navigating to a website
3. Execute JavaScript without any prompts
4. Take screenshots without permission dialogs

## Security Considerations

⚠️ **Important**: These settings reduce Safari's security. Only use them:
- In a dedicated development profile
- On trusted networks
- With known, safe websites
- Disable when not actively developing

## Troubleshooting

### Still Getting Permission Prompts?

1. **Restart all applications** after changing permissions
2. Check Console.app for any security/sandbox errors
3. Ensure Safari isn't in "Private Browsing" mode
4. Try running this reset command:
   ```bash
   tccutil reset AppleEvents
   ```
   Then re-grant permissions

### Safari Not Responding to Commands?

1. Quit and restart Safari
2. Check Activity Monitor for any hung Safari processes
3. Reset Safari's preferences if needed

### Enhanced Automation Script

For even more control, create this helper script:

```bash
#!/bin/bash
# save as: ~/safari-dev-mode.sh

# Enable developer mode and permissions
defaults write com.apple.Safari IncludeDevelopMenu -bool true
defaults write com.apple.Safari AllowJavaScriptFromAppleEvents -bool true
defaults write com.apple.Safari ShowFavoritesBar -bool true

# Restart Safari to apply changes
osascript -e 'quit app "Safari"'
sleep 2
osascript -e 'activate app "Safari"'

echo "Safari configured for full automation access"
```

Make it executable: `chmod +x ~/safari-dev-mode.sh`

## Next Steps

With full access configured, the Safari MCP server can:
- Navigate without prompts
- Execute any JavaScript
- Access developer tools programmatically
- Take screenshots instantly
- Monitor all console output
- Control multiple windows/tabs

The server is now ready for seamless development workflows!