#!/bin/bash

echo "================================"
echo "Create GitHub Release"
echo "================================"
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Error: git is not installed"
    exit 1
fi

# Check if jq is available for parsing JSON
if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: jq is not installed. Using basic parsing."
    VERSION=$(grep -o '"version": *"[^"]*"' package.json | cut -d'"' -f4)
else
    VERSION=$(jq -r '.version' package.json)
fi

echo "Current version in package.json: $VERSION"
echo ""
echo "This will create a new release tag: v$VERSION"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Release cancelled."
    exit 0
fi

echo ""
echo "[1/4] Building extension..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "[2/4] Creating ZIP file..."
npm run zip
if [ $? -ne 0 ]; then
    echo "❌ ZIP creation failed!"
    exit 1
fi

echo ""
echo "[3/4] Creating git tag..."
git tag -a "v$VERSION" -m "Release version $VERSION"
if [ $? -ne 0 ]; then
    echo "❌ Tag creation failed!"
    exit 1
fi

echo ""
echo "[4/4] Pushing tag to GitHub..."
git push origin "v$VERSION"
if [ $? -ne 0 ]; then
    echo "❌ Push failed! You may need to authenticate."
    exit 1
fi

echo ""
echo "================================"
echo "✅ RELEASE CREATED SUCCESSFULLY!"
echo "================================"
echo ""
echo "Tag: v$VERSION"
echo ""
echo "GitHub Actions will now:"
echo "1. Build the extension"
echo "2. Create ZIP file"
echo "3. Create GitHub Release"
echo "4. Upload ZIP to releases"
echo ""
echo "Check progress at: https://github.com/[YOUR-USERNAME]/chrome-translation-assistant/actions"
echo ""
