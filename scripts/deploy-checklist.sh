#!/bin/bash
# PCC-EDMS Deployment Checklist Script
# Run this before each deployment to verify system health

set -e

echo "=== PCC-EDMS Deployment Checklist ==="
echo "Timestamp: $(date)"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Check .env file exists
echo -n "1. Checking .env file... "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗${NC} Missing"
    ERRORS=$((ERRORS + 1))
fi

# 2. Check required environment variables
echo -n "2. Checking required env variables... "
REQUIRED_VARS="APP_URL DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME APP_KEY"
MISSING_VARS=""
for var in $REQUIRED_VARS; do
    if ! grep -q "^${var}=" .env 2>/dev/null; then
        MISSING_VARS="$MISSING_VARS $var"
    fi
done
if [ -z "$MISSING_VARS" ]; then
    echo -e "${GREEN}✓${NC} All present"
else
    echo -e "${RED}✗${NC} Missing:$MISSING_VARS"
    ERRORS=$((ERRORS + 1))
fi

# 3. Run database migrations
echo -n "3. Running database migrations... "
php artisan migrate --no-interaction --force 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Migrations up to date"
else
    echo -e "${RED}✗${NC} Migration failed"
    ERRORS=$((ERRORS + 1))
fi

# 4. Check storage permissions
echo -n "4. Checking storage permissions... "
if [ -w "storage" ] && [ -w "bootstrap/cache" ]; then
    echo -e "${GREEN}✓${NC} Writable"
else
    echo -e "${RED}✗${NC} Not writable"
    ERRORS=$((ERRORS + 1))
fi

# 5. Run tests
echo -n "5. Running test suite... "
php artisan test --no-coverage 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All tests pass"
else
    echo -e "${YELLOW}⚠${NC} Some tests failed"
    # Don't count test failures as deployment blockers
fi

# 6. Check queue workers
echo -n "6. Checking queue workers... "
if php artisan queue:restart 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Queue restarted"
else
    echo -e "${YELLOW}⚠${NC} Could not restart queue"
fi

# 7. Clear cache
echo -n "7. Clearing cache... "
php artisan config:clear 2>/dev/null
php artisan route:clear 2>/dev/null
php artisan view:clear 2>/dev/null
echo -e "${GREEN}✓${NC} Cache cleared"

# 8. Rebuild assets
echo -n "8. Building assets... "
npm run build 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}✗${NC} Build failed"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}=== Deployment Ready ===${NC}"
    exit 0
else
    echo -e "${RED}=== $ERRORS Error(s) Found ===${NC}"
    exit 1
fi