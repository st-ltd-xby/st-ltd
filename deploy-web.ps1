# 一键构建+部署前端到 Cloudflare Pages
Write-Host "=== 构建前端 ===" -ForegroundColor Cyan
Set-Location g:\LTD\packages\web
npx vite build

Write-Host "`n=== 部署到 Cloudflare Pages ===" -ForegroundColor Cyan
Set-Location g:\LTD
npx wrangler pages deploy packages\web\dist --branch main --commit-dirty=true --skip-caching

Write-Host "`n=== 部署完成 ===" -ForegroundColor Green
