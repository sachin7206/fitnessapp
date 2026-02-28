#!/bin/bash

echo "📦 Installing Maven using Homebrew..."
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed."
    echo ""
    echo "Install Homebrew first:"
    echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    exit 1
fi

echo "✅ Homebrew is installed"
echo ""

# Install Maven
echo "Installing Maven..."
brew install maven

# Verify installation
if command -v mvn &> /dev/null; then
    echo ""
    echo "✅ Maven installed successfully!"
    mvn -version
    echo ""
    echo "Now run: ./init-backend.sh"
else
    echo "❌ Maven installation failed"
    exit 1
fi

