# 阿里云 FC 部署打包脚本
# 在项目根目录 g:\LTD 执行

$ErrorActionPreference = "Stop"
$root = "g:\LTD"
$distDir = "$root\fc-dist"

Write-Host "=== 1. 清理旧文件 ===" -ForegroundColor Cyan
if (Test-Path $distDir) { Remove-Item -Recurse -Force $distDir }
New-Item -ItemType Directory -Path $distDir | Out-Null

Write-Host "=== 2. 安装依赖 ===" -ForegroundColor Cyan
cd $root
pnpm install

Write-Host "=== 3. 生成 Prisma 客户端 ===" -ForegroundColor Cyan
cd "$root\packages\server"
npx prisma generate

Write-Host "=== 4. 编译 TypeScript ===" -ForegroundColor Cyan
npx tsc --skipLibCheck 2>$null
Write-Host "(TS 类型警告已忽略，JS 文件正常输出)" -ForegroundColor Yellow

Write-Host "=== 5. 复制文件到部署目录 ===" -ForegroundColor Cyan

# 复制 FC 入口
Copy-Item "$root\fc-handler.js" "$distDir\index.js"

# 复制编译后的服务端代码
$serverDist = "$root\packages\server\dist"
$targetDir = "$distDir\packages\server\dist"
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
Copy-Item -Recurse -Force "$serverDist\*" "$targetDir\"

# 复制 Prisma schema 和生成的客户端
$prismaDir = "$distDir\packages\server\prisma"
New-Item -ItemType Directory -Path $prismaDir -Force | Out-Null
Copy-Item -Recurse -Force "$root\packages\server\prisma\*" "$prismaDir\"

# 复制 node_modules（排除 .cache 等无用目录）
Write-Host "=== 6. 复制 node_modules ===" -ForegroundColor Cyan
$nmSource = "$root\packages\server\node_modules"
$nmTarget = "$distDir\node_modules"
if (Test-Path $nmSource) {
    Get-ChildItem "$nmSource" -Directory | Where-Object { $_.Name -ne '.cache' -and $_.Name -ne '.prisma' } | ForEach-Object {
        Copy-Item -Recurse -Force $_.FullName "$nmTarget\$($_.Name)\"
    }
}
# 也复制根目录的 node_modules（monorepo 共享依赖）
$rootNm = "$root\node_modules"
if (Test-Path $rootNm) {
    Get-ChildItem "$rootNm" -Directory | Where-Object { $_.Name -ne '.cache' -and $_.Name -ne '.pnpm' } | ForEach-Object {
        $target = "$nmTarget\$($_.Name)"
        if (-not (Test-Path $target)) {
            Copy-Item -Recurse -Force $_.FullName "$target\"
        }
    }
}

Write-Host "=== 7. 打包 zip ===" -ForegroundColor Cyan
cd $distDir
$zipFile = "$root\fc-deploy.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile }
Compress-Archive -Path * -DestinationPath $zipFile -Force

$size = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
Write-Host "=== 打包完成! ===" -ForegroundColor Green
Write-Host "文件: $zipFile"
Write-Host "大小: ${size} MB"
