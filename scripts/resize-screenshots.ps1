# Script PowerShell pour redimensionner les screenshots iPhone 13 → 1242×2688 (App Store)
# Ajoute du padding blanc au lieu d'étirer l'image
#
# Usage :
#   1. Placez tous vos screenshots (PNG) dans un dossier "input"
#   2. Ouvrez PowerShell dans ce dossier
#   3. Lancez : .\resize-screenshots.ps1
#   4. Les images redimensionnées apparaissent dans "output"

Add-Type -AssemblyName System.Drawing

$inputDir = "input"
$outputDir = "output"
$targetWidth = 1242
$targetHeight = 2688

if (!(Test-Path $inputDir)) { New-Item -ItemType Directory -Path $inputDir | Out-Null; Write-Host "Créé le dossier '$inputDir'. Placez vos screenshots dedans et relancez." -ForegroundColor Yellow; exit }
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

Get-ChildItem $inputDir -Filter "*.png" | ForEach-Object {
    $srcPath = $_.FullName
    $dstPath = Join-Path $outputDir $_.Name
    $src = [System.Drawing.Image]::FromFile($srcPath)

    # Calcule le scale pour que l'image rentre dans la target en gardant le ratio
    $scale = [Math]::Min($targetWidth / $src.Width, $targetHeight / $src.Height)
    $newWidth = [int]($src.Width * $scale)
    $newHeight = [int]($src.Height * $scale)

    $canvas = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight
    $gfx = [System.Drawing.Graphics]::FromImage($canvas)
    $gfx.Clear([System.Drawing.Color]::White)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $x = ($targetWidth - $newWidth) / 2
    $y = ($targetHeight - $newHeight) / 2
    $gfx.DrawImage($src, $x, $y, $newWidth, $newHeight)
    $canvas.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $gfx.Dispose()
    $canvas.Dispose()
    $src.Dispose()
    Write-Host "OK: $($_.Name) -> $targetWidth x $targetHeight" -ForegroundColor Green
}

Write-Host "`nTerminé ! Images dans '$outputDir'" -ForegroundColor Cyan
