Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$deploy = Join-Path $root "deploy"

if (Test-Path $deploy) {
    Remove-Item -Path $deploy -Recurse -Force
}

New-Item -ItemType Directory -Path $deploy | Out-Null

# Copy everything first so deploy has all assets and API files,
# excluding the deploy folder itself.
$excludeNames = @("deploy", ".git", "node_modules", "scripts", "package.json", "package-lock.json")
$itemsToCopy = Get-ChildItem -Path $root -Force | Where-Object { $excludeNames -notcontains $_.Name }
foreach ($item in $itemsToCopy) {
    Copy-Item -Path $item.FullName -Destination $deploy -Recurse -Force
}

$minifyArgs = @(
    "--collapse-whitespace",
    "--remove-comments",
    "--remove-redundant-attributes",
    "--remove-script-type-attributes",
    "--remove-tag-whitespace",
    "--use-short-doctype",
    "--minify-css", "true",
    "--minify-js", "true"
)

npx html-minifier-terser @minifyArgs -o (Join-Path $deploy "index.html") (Join-Path $root "index.html")
npx html-minifier-terser @minifyArgs -o (Join-Path $deploy "projects.html") (Join-Path $root "projects.html")

Write-Host "Deploy build complete. Minified files are in: $deploy"
Write-Host "Your local source files remain editable in the project root."
