# Génère des screenshots iPad 13" (2064×2752) à partir de screenshots iPhone
# Sortie garantie EXACTE en dimensions, sans canal alpha, format JPG
#
# Usage :
#   1. Placez 3+ screenshots iPhone (any size) dans "input-iphone/"
#   2. Lancez : powershell -ExecutionPolicy Bypass -File .\make-ipad-screenshots.ps1
#   3. Récupérez les images dans "output-ipad/"

Add-Type -AssemblyName System.Drawing

$inputDir  = "input-iphone"
$outputDir = "output-ipad"
$targetW   = 2064
$targetH   = 2752

if (!(Test-Path $inputDir))  {
  New-Item -ItemType Directory -Path $inputDir | Out-Null
  Write-Host "Dossier '$inputDir' créé. Placez-y vos screenshots iPhone puis relancez." -ForegroundColor Yellow
  exit
}
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

$files = Get-ChildItem $inputDir -Include *.png,*.jpg,*.jpeg -Recurse -File
if ($files.Count -eq 0) {
  Write-Host "Aucune image trouvée dans '$inputDir'." -ForegroundColor Red
  exit
}

foreach ($file in $files) {
  $src = [System.Drawing.Image]::FromFile($file.FullName)

  # Scale l'image pour qu'elle rentre dans 2064x2752 en gardant le ratio
  $scale = [Math]::Min($targetW / $src.Width, $targetH / $src.Height)
  $newW  = [int]($src.Width  * $scale)
  $newH  = [int]($src.Height * $scale)

  # Crée un canvas JPG RGB (pas d'alpha) de la taille exacte
  $canvas = New-Object System.Drawing.Bitmap $targetW, $targetH, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $gfx = [System.Drawing.Graphics]::FromImage($canvas)
  $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gfx.Clear([System.Drawing.Color]::White)
  $gfx.DrawImage($src, [int](($targetW - $newW) / 2), [int](($targetH - $newH) / 2), $newW, $newH)

  $outName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + "-ipad.jpg"
  $outPath = Join-Path $outputDir $outName

  # Encode en JPG qualité 95
  $jpgCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
  $params = New-Object System.Drawing.Imaging.EncoderParameters 1
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, 95L)
  $canvas.Save($outPath, $jpgCodec, $params)

  $gfx.Dispose()
  $canvas.Dispose()
  $src.Dispose()
  Write-Host ("  OK -> " + $outName + " (" + $targetW + "x" + $targetH + ")") -ForegroundColor Green
}

Write-Host ""
Write-Host ("Terminé ! " + $files.Count + " image(s) générée(s) dans '" + $outputDir + "'") -ForegroundColor Cyan
Write-Host "Dimensions garanties : 2064 x 2752, format JPG, sans canal alpha" -ForegroundColor Cyan
