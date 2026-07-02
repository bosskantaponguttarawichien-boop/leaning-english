#!/usr/bin/env bash

# Harness Bootstrapping and Health Check Script (Bash)
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============ 🤖 Harness Environment Verification ============${NC}"

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
else
    echo -e "${GREEN}[PASS] Node.js version: $(node -v)${NC}"
fi

# 2. Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed. Please install npm first.${NC}"
    exit 1
else
    echo -e "${GREEN}[PASS] npm version: $(npm -v)${NC}"
fi

# 3. Check node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[WARN] node_modules not found. Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}[PASS] node_modules exists.${NC}"
fi

# 4. Run TypeScript Check
echo -e "${BLUE}Running TypeScript type checking...${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}[PASS] TypeScript type check passed.${NC}"
else
    echo -e "${RED}[FAIL] TypeScript check failed. Fix the type errors before editing.${NC}"
    exit 1
fi

# 5. Run Linter Check
echo -e "${BLUE}Running ESLint linter...${NC}"
if npm run lint; then
    echo -e "${GREEN}[PASS] Linter check passed.${NC}"
else
    echo -e "${RED}[FAIL] Linter check failed. Fix lint issues before editing.${NC}"
    exit 1
fi

echo -e "${GREEN}============ ✅ Harness Status: READY TO WORK ============${NC}"
exit 0
