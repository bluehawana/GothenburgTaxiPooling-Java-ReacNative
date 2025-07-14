#!/bin/bash

echo "🎨 Creating simple splash screen..."

cd "/Users/bluehawana/Projects/Taxi/GothenburgTaxiDriver/assets"

# Create a simple colored splash screen (we'll add logo manually)
/usr/bin/python3 -c "
from PIL import Image
import os

# Create a 1284x2778 green background
img = Image.new('RGB', (1284, 2778), '#059669')
img.save('splash-icon.png')
print('✅ Splash background created')
"