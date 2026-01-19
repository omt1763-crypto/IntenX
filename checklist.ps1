#!/usr/bin/env pwsh
# Resume Analyzer - Pre-Deployment Checklist

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "   Resume Analyzer API - Pre-Deployment Checklist" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "AUTOMATED CHECKS:" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray

# Check 1: API Route File Exists
$routePath = "c:\Users\omt91\Downloads\main\interviewverse_frontend\app\api\resume-tracker\analyze\route.ts"
if (Test-Path $routePath) {
    Write-Host "[OK]" -ForegroundColor Green -NoNewline
    Write-Host " API Route File Exists"
    Write-Host "     File: app/api/resume-tracker/analyze/route.ts" -ForegroundColor Gray
} else {
    Write-Host "[FAIL]" -ForegroundColor Red -NoNewline
    Write-Host " API Route File Missing"
}
Write-Host ""

# Check 2: PDF Parse Package Installed
$pdfPath = "c:\Users\omt91\Downloads\main\interviewverse_frontend\node_modules\pdf-parse\package.json"
if (Test-Path $pdfPath) {
    Write-Host "[OK]" -ForegroundColor Green -NoNewline
    Write-Host " PDF Parse Package Installed"
    Write-Host "     Package: node_modules/pdf-parse" -ForegroundColor Gray
} else {
    Write-Host "[FAIL]" -ForegroundColor Red -NoNewline
    Write-Host " PDF Parse Package Missing"
    Write-Host "     Run: npm install pdf-parse" -ForegroundColor Yellow
}
Write-Host ""

# Check 3: OPENAI_API_KEY
$apiKey = $env:OPENAI_API_KEY
if ($apiKey) {
    Write-Host "[OK]" -ForegroundColor Green -NoNewline
    Write-Host " OPENAI_API_KEY Set Locally"
    Write-Host "     Length: $($apiKey.Length) chars" -ForegroundColor Gray
    Write-Host "     Starts with sk-proj: $($apiKey.StartsWith('sk-proj-'))" -ForegroundColor Gray
} else {
    Write-Host "[WARN]" -ForegroundColor Yellow -NoNewline
    Write-Host " OPENAI_API_KEY Not Set Locally"
    Write-Host "     (This is normal if only set in Vercel)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "MANUAL CHECKS (You must verify these):" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "1. OPENAI_API_KEY in Vercel Environment Variables" -ForegroundColor Cyan
Write-Host "   [ ] Go to Vercel Dashboard" -ForegroundColor Gray
Write-Host "   [ ] Project Settings > Environment Variables" -ForegroundColor Gray
Write-Host "   [ ] Verify OPENAI_API_KEY is set" -ForegroundColor Gray
Write-Host "   [ ] Value starts with 'sk-proj-'" -ForegroundColor Gray
Write-Host ""

Write-Host "2. OpenAI Account Status" -ForegroundColor Cyan
Write-Host "   [ ] Visit https://platform.openai.com/account/usage/overview" -ForegroundColor Gray
Write-Host "   [ ] Check usage is within limits" -ForegroundColor Gray
Write-Host "   [ ] Account has available credits" -ForegroundColor Gray
Write-Host ""

Write-Host "3. No Syntax Errors" -ForegroundColor Cyan
Write-Host "   [ ] Open app/api/resume-tracker/analyze/route.ts" -ForegroundColor Gray
Write-Host "   [ ] No red error squiggles visible" -ForegroundColor Gray
Write-Host "   [ ] File can be saved without errors" -ForegroundColor Gray
Write-Host ""

Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "DEPLOYMENT STEPS:" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "1. Verify OPENAI_API_KEY in Vercel" -ForegroundColor Cyan
Write-Host "   - Project Settings > Environment Variables" -ForegroundColor Gray
Write-Host "   - Add OPENAI_API_KEY if not already there" -ForegroundColor Gray
Write-Host "   - Value: Your actual OpenAI API key" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Redeploy to Vercel" -ForegroundColor Cyan
Write-Host "   - Go to Deployments tab" -ForegroundColor Gray
Write-Host "   - Click 'Redeploy' on latest deployment" -ForegroundColor Gray
Write-Host "   - Wait 2-5 minutes for completion" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check Vercel Logs" -ForegroundColor Cyan
Write-Host "   - Deployments > Your deployment > Logs" -ForegroundColor Gray
Write-Host "   - Search for '[Resume Tracker]'" -ForegroundColor Gray
Write-Host "   - Should see: 'OPENAI_API_KEY is configured'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test the API" -ForegroundColor Cyan
Write-Host "   - Try uploading a resume in your app" -ForegroundColor Gray
Write-Host "   - Or run: . 'test-api-enhanced.ps1'" -ForegroundColor Gray
Write-Host "   - Should return analysis results" -ForegroundColor Gray
Write-Host ""

Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray
Write-Host "TEST FILES AVAILABLE:" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. test-api-enhanced.ps1 (PowerShell)" -ForegroundColor Cyan
Write-Host "     Tests the full API endpoint" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. test-openai-direct.js (Node.js)" -ForegroundColor Cyan
Write-Host "     Tests OpenAI API directly" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. test-endpoint.js (Node.js)" -ForegroundColor Cyan
Write-Host "     Alternative endpoint test" -ForegroundColor Gray
Write-Host ""

Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "QUICK START:" -ForegroundColor Green
Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "If everything is set up correctly:" -ForegroundColor Gray
Write-Host ""
Write-Host "  PS> . 'test-api-enhanced.ps1' -Endpoint 'https://your-domain.vercel.app/api/resume-tracker/analyze'" -ForegroundColor Yellow
Write-Host ""
Write-Host "-------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
