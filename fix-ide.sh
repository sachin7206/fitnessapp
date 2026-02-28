#!/bin/bash

echo "🔧 Fixing Source Root Configuration for IntelliJ IDEA..."
echo ""

# Remove IDE cache to force refresh
echo "Clearing IDE cache..."
rm -rf ~/Library/Caches/JetBrains/IntelliJIdea* 2>/dev/null
rm -rf ~/Library/Caches/JetBrains/IntelliJIdeaIC* 2>/dev/null

echo "✅ Cache cleared"
echo ""
echo "📝 Next steps:"
echo "1. Close IntelliJ IDEA completely"
echo "2. Open the backend folder as a Gradle project"
echo "3. When prompted, choose 'Open as Gradle project'"
echo "4. Wait for IDE to index the project"
echo "5. Right-click on src/main/java → Mark Directory as → Sources Root"
echo "6. Right-click on src/main/resources → Mark Directory as → Resources Root"
echo "7. Right-click on src/test/java → Mark Directory as → Test Sources Root"
echo ""
echo "Or automatically via IDE:"
echo "File → Project Structure → Modules → Select project"
echo "Then mark source folders correctly"
echo ""

