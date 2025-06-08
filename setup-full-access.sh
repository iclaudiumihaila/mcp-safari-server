#!/bin/bash

# Safari MCP Full Access Setup Script
# This script configures Safari for full automation access

echo "🚀 Safari MCP Full Access Setup"
echo "================================"

# Step 1: Enable Safari Developer Menu
echo "📱 Enabling Safari Developer Menu..."
defaults write com.apple.Safari IncludeDevelopMenu -bool true
defaults write com.apple.Safari ShowDevelopMenu -bool true

# Step 2: Allow JavaScript from Apple Events
echo "🔧 Enabling JavaScript from Apple Events..."
defaults write com.apple.Safari AllowJavaScriptFromAppleEvents -bool true

# Step 3: Disable various security warnings for development
echo "⚡ Configuring Safari for development..."
defaults write com.apple.Safari WarnAboutFraudulentWebsites -bool false
defaults write com.apple.Safari ShowFavoritesBar -bool true
defaults write com.apple.Safari ShowSidebarInTopSites -bool false
defaults write com.apple.Safari ShowFullURLInSmartSearchField -bool true

# Step 4: Grant Terminal permission to control Safari
echo "🔐 Requesting Safari automation permission..."
osascript -e 'tell application "Safari" to activate' 2>/dev/null || {
    echo "⚠️  Please grant Terminal permission to control Safari when prompted"
    echo "   Go to System Settings > Privacy & Security > Automation"
    echo "   Enable Safari for Terminal/your IDE"
}

# Step 5: Create AppleScript to test permissions
echo "✅ Testing Safari automation..."
osascript <<EOF
tell application "Safari"
    make new document
    set URL of front document to "about:blank"
    delay 1
    do JavaScript "document.body.innerHTML = '<h1>Safari MCP Full Access Configured!</h1><p>Automation is working correctly.</p>'" in front document
end tell
EOF

# Step 6: Create development profile reminder
echo ""
echo "📋 Manual Steps Required:"
echo "1. Open Safari > Settings > Profiles"
echo "2. Create a 'Development' profile for MCP usage"
echo "3. In Developer menu > Check 'Allow JavaScript from Apple Events'"
echo "4. System Settings > Privacy & Security > Automation"
echo "   - Enable Safari for your Terminal/IDE"
echo ""
echo "🎉 Setup complete! Restart Safari to apply all changes."
echo ""
echo "To restart Safari now, run:"
echo "osascript -e 'quit app \"Safari\"' && sleep 2 && open -a Safari"