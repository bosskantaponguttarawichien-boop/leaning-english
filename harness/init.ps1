# Harness Bootstrapping and Health Check Script (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "============ 🤖 Harness Environment Verification ============" -ForegroundColor Cyan

# 1. Check Node.js
try {
    $nodeVer = node -v
    Write-Host "[PASS] Node.js version: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH. Please install Node.js." -ForegroundColor Red
    Exit 1
}

# 2. Check npm
try {
    $npmVer = npm -v
    Write-Host "[PASS] npm version: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm is not installed or not in PATH. Please install npm." -ForegroundColor Red
    Exit 1
}

# 3. Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARN] node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[PASS] node_modules exists." -ForegroundColor Green
}

# 4. Run TypeScript Check
Write-Host "Running TypeScript type checking..." -ForegroundColor Cyan
$tscError = $null
& npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] TypeScript type check passed." -ForegroundColor Green
} else {
    Write-Host "[FAIL] TypeScript check failed. Fix type errors before proceeding." -ForegroundColor Red
    Exit 1
}

# 5. Run Linter Check
Write-Host "Running ESLint linter..." -ForegroundColor Cyan
& npm run lint
if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] Linter check passed." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Linter check failed. Fix lint issues before proceeding." -ForegroundColor Red
    Exit 1
}

Write-Host "============ ✅ Harness Status: READY TO WORK ============" -ForegroundColor Green
Exit 0
