#!/bin/bash

echo "🚀 Setting up Dalgo Webapp Multi-App Environment"
echo "================================================"

# Main webapp setup
echo "📦 Installing dependencies for main webapp (using yarn)..."
yarn install

if [ $? -eq 0 ]; then
    echo "✅ Main webapp dependencies installed successfully"
else
    echo "❌ Failed to install main webapp dependencies"
    exit 1
fi

# vo_new setup
echo ""
echo "📦 Installing dependencies for vo_new (using npm)..."
cd vo_new
npm install

if [ $? -eq 0 ]; then
    echo "✅ vo_new dependencies installed successfully"
else
    echo "❌ Failed to install vo_new dependencies"
    exit 1
fi

cd ..

echo ""
echo "🎉 Setup complete! You can now run:"
echo "   • Main webapp (port 3000): yarn dev:webapp"
echo "   • vo_new (port 3001): yarn dev:vo"
echo "   • Both apps simultaneously: yarn dev:both"
echo ""
echo "📍 URLs:"
echo "   • Main webapp: http://localhost:3000"
echo "   • vo_new: http://localhost:3001" 