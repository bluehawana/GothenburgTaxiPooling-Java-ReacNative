#!/bin/bash

echo "🎨 Resizing logo for Göteborg Taxi User App..."

cd "/Users/bluehawana/Projects/Taxi/GothenburgTaxiUser/assets"

# Copy icon from driver app if it exists there
if [ -f "../GothenburgTaxiDriver/assets/icon-original.png" ]; then
    cp "../GothenburgTaxiDriver/assets/icon-original.png" icon-original.png
elif [ -f "icon.png" ]; then
    cp icon.png icon-original.png
else
    echo "❌ No icon.png found. Please save your logo as icon.png first."
    exit 1
fi

# Create 1024x1024 app icon (square with padding)
convert icon-original.png -resize 1024x1024 -background transparent -gravity center -extent 1024x1024 icon.png

# Create adaptive icon (1024x1024, no padding)
convert icon-original.png -resize 1024x1024^ -gravity center -extent 1024x1024 adaptive-icon.png

# Create favicon (32x32)
convert icon-original.png -resize 32x32 favicon.png

# Create splash screen (1284x2778 with logo centered) - blue theme for user app
convert -size 1284x2778 xc:"#2563eb" splash-background.png
convert icon-original.png -resize 400x400 splash-logo.png
convert splash-background.png splash-logo.png -gravity center -composite splash-icon.png
rm splash-background.png splash-logo.png

echo "✅ User app icons created:"
echo "   - icon.png (1024x1024)"
echo "   - adaptive-icon.png (1024x1024)" 
echo "   - favicon.png (32x32)"
echo "   - splash-icon.png (1284x2778)"
echo "   - icon-original.png (backup)"