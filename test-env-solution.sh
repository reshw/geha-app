#!/bin/bash
# Test script to verify environment variables solution

echo "=== Lounge App - Environment Variables 4KB Limit Solution Test ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check .env file size
echo "Test 1: Check .env file size"
if [ -f .env ]; then
  ENV_SIZE=$(wc -c < .env)
  ENV_KB=$(echo "scale=2; $ENV_SIZE / 1024" | bc)
  
  if [ "$ENV_SIZE" -lt 1000 ]; then
    echo -e "${GREEN}✅ PASS${NC} - .env file size: ${ENV_KB}KB (under 1KB)"
  else
    echo -e "${RED}❌ FAIL${NC} - .env file size: ${ENV_KB}KB (should be under 1KB)"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP${NC} - .env file not found"
fi

echo ""

# Test 2: Run prebuild script
echo "Test 2: Run prebuild script"
if npm run prebuild >/dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC} - prebuild script executed successfully"
else
  echo -e "${RED}❌ FAIL${NC} - prebuild script failed"
fi

echo ""

# Test 3: Check config.json was generated
echo "Test 3: Check config.json generation"
if [ -f netlify/functions/config.json ]; then
  CONFIG_SIZE=$(wc -c < netlify/functions/config.json)
  CONFIG_KB=$(echo "scale=2; $CONFIG_SIZE / 1024" | bc)
  echo -e "${GREEN}✅ PASS${NC} - config.json generated (${CONFIG_KB}KB)"
  
  # Verify it's valid JSON
  if jq empty netlify/functions/config.json 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} - config.json is valid JSON"
  else
    echo -e "${RED}❌ FAIL${NC} - config.json is not valid JSON"
  fi
else
  echo -e "${RED}❌ FAIL${NC} - config.json not found"
fi

echo ""

# Test 4: Check config.json content
echo "Test 4: Check config.json content"
if [ -f netlify/functions/config.json ]; then
  echo "config.json structure:"
  jq 'keys' netlify/functions/config.json 2>/dev/null
  
  # Check for required keys
  REQUIRED_KEYS=("resend" "nhn" "openai")
  MISSING_KEYS=()
  
  for key in "${REQUIRED_KEYS[@]}"; do
    if ! jq -e ".$key" netlify/functions/config.json >/dev/null 2>&1; then
      MISSING_KEYS+=("$key")
    fi
  done
  
  if [ ${#MISSING_KEYS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC} - All required keys present"
  else
    echo -e "${RED}❌ FAIL${NC} - Missing keys: ${MISSING_KEYS[@]}"
  fi
fi

echo ""

# Test 5: Verify functions use getConfig
echo "Test 5: Verify functions use getConfig()"
FUNCTIONS=("send-email.js" "send-praise-notification.js" "send-notification.js" "send-alimtalk.js" "process-praise.js")
ALL_GOOD=true

for func in "${FUNCTIONS[@]}"; do
  if grep -q "function getConfig\|const getConfig" "netlify/functions/$func" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} $func"
  else
    echo -e "${RED}❌${NC} $func - getConfig() not found"
    ALL_GOOD=false
  fi
done

echo ""

# Test 6: Check .gitignore
echo "Test 6: Check .gitignore"
if grep -q "config.json" .gitignore 2>/dev/null && grep -q "firebase-credentials.json" .gitignore 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - config.json and firebase-credentials.json in .gitignore"
else
  echo -e "${RED}❌ FAIL${NC} - Missing gitignore entries"
fi

echo ""

# Test 7: Verify package.json prebuild script
echo "Test 7: Check package.json prebuild script"
if grep -q '"prebuild".*"node scripts/generate-config.js"' package.json; then
  echo -e "${GREEN}✅ PASS${NC} - prebuild script configured in package.json"
else
  echo -e "${RED}❌ FAIL${NC} - prebuild script not found in package.json"
fi

echo ""

# Test 8: Try building
echo "Test 8: Run npm run build"
if npm run build >/dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC} - npm run build succeeded"
else
  echo -e "${RED}❌ FAIL${NC} - npm run build failed"
fi

echo ""
echo "=== Test Summary ==="
echo "If all tests pass, deployment should succeed without 4KB environment variable limit errors."
echo "Next steps:"
echo "  1. Set environment variables in Netlify UI (see NETLIFY_MINIMAL_ENV_VARS.md)"
echo "  2. Deploy: netlify deploy --prod"
echo "  3. Monitor logs: netlify logs"
