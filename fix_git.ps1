#!/usr/bin/env powershell

$ErrorActionPreference = "Continue"

# Change to repo directory
Set-Location "c:\Users\omt91\Downloads\main\interviewverse_frontend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Configure Git" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

git config user.email "omt1763@gmail.com"
git config user.name "omt1763"

Write-Host "✓ Git config set" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 2: Pull Latest Changes" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

$env:GIT_EDITOR = "true"
git pull origin main --no-edit

Write-Host "✓ Pulled latest changes" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 3: Check Status" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

git status --short

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 4: Commit with Correct Author" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

git add -A
git commit -m "Fix: Correct author email for Vercel deployment" --author="omt1763 <omt1763@gmail.com>"

Write-Host "✓ Committed with correct author" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 5: Push to GitHub" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

git push origin main

Write-Host "`n✓ ALL DONE! Changes pushed to GitHub" -ForegroundColor Green
Write-Host "Vercel will auto-deploy in 2-3 minutes..." -ForegroundColor Yellow
