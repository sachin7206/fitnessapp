#!/bin/bash
# ============================================
# Push Fitness App to GitHub
# ============================================
# Run this script from the fitnessapp directory:
#   chmod +x push-to-github.sh && ./push-to-github.sh
# ============================================

set -e

echo "=========================================="
echo "  Push Fitness App to GitHub"
echo "=========================================="
echo ""

# Step 1: Check if gh is authenticated
echo "[1/4] Checking GitHub CLI authentication..."
if ! gh auth status >/dev/null 2>&1; then
    echo "  ⚠️  Not authenticated. Starting login..."
    echo ""
    gh auth login
    echo ""
fi

# Verify auth
if ! gh auth status >/dev/null 2>&1; then
    echo "  ❌ Authentication failed. Please try again."
    exit 1
fi
echo "  ✅ Authenticated with GitHub"
echo ""

# Step 2: Get GitHub username
GH_USER=$(gh api user --jq '.login' 2>/dev/null)
echo "[2/4] GitHub user: $GH_USER"
echo ""

# Step 3: Create the repo
REPO_NAME="fitnessapp"
echo "[3/4] Creating repository '$GH_USER/$REPO_NAME'..."

if gh repo view "$GH_USER/$REPO_NAME" >/dev/null 2>&1; then
    echo "  ⚠️  Repository already exists. Adding as remote..."
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"
else
    gh repo create "$REPO_NAME" --private --source=. --remote=origin
    echo "  ✅ Repository created: https://github.com/$GH_USER/$REPO_NAME"
fi
echo ""

# Step 4: Push
echo "[4/4] Pushing code..."
git push -u origin main
echo ""

echo "=========================================="
echo "  ✅ Done!"
echo "=========================================="
echo ""
echo "  Repository: https://github.com/$GH_USER/$REPO_NAME"
echo "  Branch: main"
echo ""
echo "  To clone on another machine:"
echo "    git clone https://github.com/$GH_USER/$REPO_NAME.git"
echo ""

