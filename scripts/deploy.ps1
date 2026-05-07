Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$deploy = Join-Path $root "deploy"

Write-Host "Step 1: Building minified deploy folder..." -ForegroundColor Cyan
Push-Location $root
npm run build:deploy
Pop-Location

Write-Host "`nStep 2: Copying minified files to root..." -ForegroundColor Cyan
Copy-Item -Path "$deploy\index.html" -Destination "$root\index.html" -Force
Copy-Item -Path "$deploy\projects.html" -Destination "$root\projects.html" -Force
Write-Host "Minified HTML files copied to root" -ForegroundColor Green

Write-Host "`nStep 3: Committing and pushing to Vercel..." -ForegroundColor Cyan
Push-Location $root
git add index.html projects.html
$commitMsg = "Deploy: minified HTML source"
git commit -m $commitMsg
git push
Pop-Location

Write-Host "`nDeploy complete! Your minified site is now live on Vercel." -ForegroundColor Green
