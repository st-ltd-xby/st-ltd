Add-Type -Assembly System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead('g:\LTD\fc-deploy.zip')
Write-Host "=== Top-level entries ==="
$zip.Entries | Where-Object { $_.FullName -notlike '*/*' } | ForEach-Object { Write-Host $_.FullName }
Write-Host "=== packages dir ==="
$zip.Entries | Where-Object { $_.FullName -like 'packages/*' -and $_.FullName -notlike 'packages/*/*/*/*' } | ForEach-Object { Write-Host $_.FullName }
Write-Host "=== app.js check ==="
$found = $zip.Entries | Where-Object { $_.FullName -like '*app.js' }
if ($found) { $found | ForEach-Object { Write-Host $_.FullName } } else { Write-Host "app.js NOT FOUND in zip!" }
$zip.Dispose()
