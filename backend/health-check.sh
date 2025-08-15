#!/bin/bash

# Health check script for the JobTrack backend container (Quart + Hypercorn)
# This script checks if the application is running and can connect to external services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
HOST=${1:-localhost}
PORT=${2:-5000}
TIMEOUT=${3:-10}

echo "🔍 Health Check for JobTrack Backend (Quart + Granian)"
echo "📍 Checking: http://${HOST}:${PORT}"
echo "⏱️  Timeout: ${TIMEOUT}s"
echo ""

# Check if the application is responding
if curl -f -s --max-time $TIMEOUT "http://${HOST}:${PORT}/api/logos/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is responding${NC}"
    
    # Get detailed health information
    HEALTH_RESPONSE=$(curl -s --max-time $TIMEOUT "http://${HOST}:${PORT}/api/logos/health" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ ! -z "$HEALTH_RESPONSE" ]; then
        echo -e "${GREEN}📊 Health Details:${NC}"
        echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
        
        # Check if Redis is connected
        if echo "$HEALTH_RESPONSE" | grep -q '"redis": "connected"'; then
            echo -e "${GREEN}✅ Redis connection: OK${NC}"
        else
            echo -e "${YELLOW}⚠️  Redis connection: Not optimal${NC}"
        fi
        
        # Check overall status
        if echo "$HEALTH_RESPONSE" | grep -q '"status": "healthy"'; then
            echo -e "${GREEN}✅ Overall status: Healthy${NC}"
            echo -e "${GREEN}🚀 Server: Quart + Granian (Rust-powered ASGI)${NC}"
            exit 0
        else
            echo -e "${YELLOW}⚠️  Overall status: Degraded${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Could not parse health response${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Application is not responding${NC}"
    echo -e "${RED}💡 Check if:${NC}"
    echo "   - Container is running with Granian"
    echo "   - Port ${PORT} is accessible"
    echo "   - Database connection is working"
    echo "   - Environment variables are set correctly"
    echo "   - Quart application started successfully"
    exit 1
fi
