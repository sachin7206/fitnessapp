#!/bin/bash

echo "🏋️  Fitness Wellness Platform - Complete Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java is not installed${NC}"
    echo "   Install: https://adoptium.net/"
    exit 1
else
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d. -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        echo -e "${RED}❌ Java 17+ required. Current: $JAVA_VERSION${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Java $JAVA_VERSION${NC}"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Install: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"
fi

# Check Maven
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}❌ Maven is not installed${NC}"
    echo "   Install: brew install maven"
    exit 1
else
    MVN_VERSION=$(mvn -v | head -n 1)
    echo -e "${GREEN}✅ Maven installed${NC}"
fi

# Check MongoDB
if ! command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB CLI (mongosh) not found${NC}"
    echo "   Install: brew tap mongodb/brew && brew install mongodb-community@7.0"
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ MongoDB CLI installed${NC}"
fi

echo ""
echo "📦 Setting up backend..."
./init-backend.sh

echo ""
echo "📦 Setting up mobile app..."
./init-mobile.sh

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "📚 Next Steps:"
echo "   1. Start MongoDB: brew services start mongodb-community@7.0"
echo "   2. Start Backend: cd backend && ./mvnw spring-boot:run"
echo "   3. Start Mobile (new terminal): cd mobile && npm start"
echo ""
echo "📖 Read QUICKSTART.md for detailed instructions"
echo ""

