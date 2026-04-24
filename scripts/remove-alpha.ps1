# Supprime le canal alpha de toutes les images PNG du dossier "input"
# Usage : place tes PNG dans "input/", puis lance .\remove-alpha.ps1

Add-Type -AssemblyName System.Drawing

$inputDir = "input"
$outputDir = "output-no-alpha"

if (!(Test-Path $inputDir)) { New-Item -ItemType Directory -Path $inputDir | Out-Null; Write-Host "Créé '$inputDir'. Placez vos PNG dedans et relancez." -ForegroundColor Yellow; exit }
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

Get-ChildItem $inputDir -Filter "*.png" | ForEach-Object {
    $src = [System.Drawing.Image]::FromFile($_.FullName)
    $dst = New-Object System.Drawing.Bitmap $src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
    $gfx = [System.Drawing.Graphics]::FromImage($dst)
    $gfx.Clear([System.Drawing.Color]::White)
    $gfx.DrawImage($src, 0, 0, $src.Width, $src.Height)
    $dst.Save((Join-Path $outputDir $_.Name), [System.Drawing.Imaging.ImageFormat]::Png)
    $gfx.Dispose(); $dst.Dispose(); $src.Dispose()
    Write-Host "OK: $($_.Name)" -ForegroundColor Green
}

Write-Host "`nTerminé ! Images sans alpha dans '$outputDir'" -ForegroundColor Cyan
