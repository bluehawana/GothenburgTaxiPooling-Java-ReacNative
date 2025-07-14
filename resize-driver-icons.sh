#!/bin/bash

echo "🎨 Resizing logo for Göteborg Taxi Driver App..."

cd "/Users/bluehawana/Projects/Taxi/GothenburgTaxiDriver/assets"

# Backup original
cp icon.png icon-original.png

# Create 1024x1024 app icon (square with padding)
convert icon-original.png -resize 1024x1024 -background transparent -gravity center -extent 1024x1024 icon.png

# Create adaptive icon (1024x1024, no padding)
convert icon-original.png -resize 1024x1024^ -gravity center -extent 1024x1024 adaptive-icon.png

# Create favicon (32x32)
convert icon-original.png -resize 32x32 favicon.png

# Create splash screen (1284x2778 with logo centered)
convert -size 1284x2778 xc:"#059669" splash-background.png
convert icon-original.png -resize 400x400 splash-logo.png
convert splash-background.png splash-logo.png -gravity center -composite splash-icon.png
rm splash-background.png splash-logo.png

echo "✅ Driver app icons created:"
echo "   - icon.png (1024x1024)"
echo "   - adaptive-icon.png (1024x1024)" 
echo "   - favicon.png (32x32)"
echo "   - splash-icon.png (1284x2778)"
echo "   - icon-original.png (backup)"