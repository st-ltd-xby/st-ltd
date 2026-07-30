Add-Type -Assembly System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead('g:\LTD\fc-deploy.zip')
Write-Host "Total files: $($zip.Entries.Count)"
Write-Host "--- Key files ---"
$zip.Entries | Where-Object { $_.FullName -eq 'index.js' } | ForEach-Object { Write-Host $_.FullName }
$zip.Entries | Where-Object { $_.FullName -like 'packages/server/dist/app.js' } | ForEach-Object { Write-Host $_.FullName }
$zip.Entries | Where-Object { $_.FullName -like '*query_engine*' } | ForEach-Object { Write-Host $_.FullName }
$zip.Entries | Where-Object { $_.FullName -like 'packages/server/prisma/*' } | ForEach-Object { Write-Host $_.FullName }
$zip.Dispose()
