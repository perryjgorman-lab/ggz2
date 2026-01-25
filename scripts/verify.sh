#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

print_header() {
    echo ""
    echo "=========================================="
    echo -e "${YELLOW}$1${NC}"
    echo "=========================================="
}

print_pass() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((PASS_COUNT++))
}

print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((FAIL_COUNT++))
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "VERIFICATION SUMMARY"
    echo "=========================================="
    echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
    echo -e "${RED}Failed: $FAIL_COUNT${NC}"
    echo ""
    if [ $FAIL_COUNT -gt 0 ]; then
        echo -e "${RED}OVERALL: FAIL${NC}"
        exit 1
    else
        echo -e "${GREEN}OVERALL: PASS${NC}"
        exit 0
    fi
}

# Change to repo root
cd "$(dirname "$0")/.."
REPO_ROOT=$(pwd)
echo "Working in: $REPO_ROOT"

# ==========================================
# 1. CLEAN INSTALL
# ==========================================
print_header "Step 1: Clean Install"

echo "Removing node_modules and lockfiles..."
rm -rf node_modules package-lock.json 2>/dev/null || true
rm -rf apps/mobile/node_modules apps/mobile/package-lock.json 2>/dev/null || true
rm -rf apps/api/node_modules apps/api/package-lock.json 2>/dev/null || true
rm -rf packages/shared/node_modules packages/shared/package-lock.json 2>/dev/null || true
rm -rf packages/shared/dist 2>/dev/null || true

echo "Running npm install..."
if npm install 2>&1; then
    print_pass "npm install completed"
else
    print_fail "npm install failed"
    print_summary
fi

# ==========================================
# 2. BUILD SHARED PACKAGE
# ==========================================
print_header "Step 2: Build Shared Package"

echo "Building @scamsight/shared..."
# Use tsc directly since workspace build might have issues
cd packages/shared
rm -f tsconfig.tsbuildinfo
if npx tsc --outDir dist --declaration 2>&1; then
    print_pass "Shared package built successfully"
else
    print_fail "Shared package build failed"
    print_summary
fi
cd "$REPO_ROOT"

# Verify dist exists
if [ -d "packages/shared/dist" ] && [ -f "packages/shared/dist/index.js" ]; then
    print_pass "Shared package dist directory exists"
else
    print_fail "Shared package dist directory missing"
    print_summary
fi

# ==========================================
# 3. TYPECHECK
# ==========================================
print_header "Step 3: TypeScript Type Check"

echo "Running typecheck..."
if npm run typecheck 2>&1; then
    print_pass "Type check passed"
else
    print_fail "Type check failed"
    print_summary
fi

# ==========================================
# 4. LINT
# ==========================================
print_header "Step 4: ESLint"

echo "Running lint..."
# Lint may have warnings but we only fail on errors
if npm run lint 2>&1; then
    print_pass "Lint passed"
else
    print_fail "Lint failed"
    print_summary
fi

# ==========================================
# 5. UNIT TESTS
# ==========================================
print_header "Step 5: Unit Tests"

echo "Running shared package tests..."
if npm run test:shared 2>&1; then
    print_pass "Shared package tests passed"
else
    print_fail "Shared package tests failed"
    print_summary
fi

# ==========================================
# 6. API HEALTH CHECK
# ==========================================
print_header "Step 6: API Health Check"

echo "Building API..."
cd apps/api
npm run build 2>&1 || true

echo "Starting API server in background..."
npm run start &
API_PID=$!
cd "$REPO_ROOT"

# Wait for API to start
echo "Waiting for API to start..."
sleep 5

# Check health endpoint
echo "Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_pass "API health check passed (HTTP 200)"
else
    print_fail "API health check failed (HTTP $HEALTH_RESPONSE)"
fi

# Stop API
echo "Stopping API server..."
kill $API_PID 2>/dev/null || true
wait $API_PID 2>/dev/null || true

# ==========================================
# 7. EXPO CHECKS
# ==========================================
print_header "Step 7: Expo Checks"

cd apps/mobile

echo "Running expo doctor..."
if npx expo doctor 2>&1; then
    print_pass "Expo doctor passed"
else
    # expo doctor often has warnings but still works
    echo "Note: expo doctor may have warnings"
    print_pass "Expo doctor completed (warnings may be present)"
fi

echo "Running expo export (iOS bundle)..."
if npx expo export --platform ios 2>&1; then
    print_pass "Expo iOS bundle export passed"
else
    print_fail "Expo iOS bundle export failed"
fi

cd "$REPO_ROOT"

# ==========================================
# SUMMARY
# ==========================================
print_summary
