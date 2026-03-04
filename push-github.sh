#!/bin/bash
# Usage: ./push-github.sh YOUR_GITHUB_PAT
#
# Generate a PAT at: https://github.com/settings/tokens
# Select scope: "repo" (Full control of private repositories)
#
# This script pushes without storing your token permanently.

if [ -z "$1" ]; then
  echo ""
  echo "==========================================="
  echo "  GitHub Push Helper"
  echo "==========================================="
  echo ""
  echo "Usage: ./push-github.sh YOUR_GITHUB_PAT"
  echo ""
  echo "Steps to get a Personal Access Token:"
  echo "  1. Go to: https://github.com/settings/tokens"
  echo "  2. Click 'Generate new token (classic)'"
  echo "  3. Name: 'fitnessapp-push'"
  echo "  4. Select scope: 'repo'"
  echo "  5. Click 'Generate token'"
  echo "  6. Copy the token and run:"
  echo "     ./push-github.sh ghp_xxxxxxxxxxxx"
  echo ""
  exit 1
fi

TOKEN=$1
cd "$(dirname "$0")"

echo "Pushing to GitHub..."
git push https://sachin7206:${TOKEN}@github.com/sachin7206/fitnessapp.git main 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Push successful!"
else
  echo ""
  echo "❌ Push failed. Check your token and try again."
fi

