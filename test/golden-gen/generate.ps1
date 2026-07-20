param(
  [string]$MagickPath = "tooling/imagemagick/magick.exe",
  [string]$SourceDir = "test/fixtures/source",
  [string]$GoldenDir = "test/fixtures/golden",
  [string]$ManifestPath = "test/fixtures/golden/manifest.json"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path "$PSScriptRoot/../.."
$MagickExe = Join-Path $RepoRoot $MagickPath
$SourceRoot = Join-Path $RepoRoot $SourceDir
$GoldenRoot = Join-Path $RepoRoot $GoldenDir
$ManifestFile = Join-Path $RepoRoot $ManifestPath

if (-not (Test-Path $MagickExe)) { throw "magick.exe not found at $MagickExe" }

$Sources = @(
  "source-100x100.png"
  "source-101x99.png"
  "source-alpha-100x100.png"
  "source-icc-100x100.png"
  "source.jpg"
)

Write-Host "=== Regenerating golden fixtures ===" -ForegroundColor Cyan
Write-Host "Magick: $MagickExe" -ForegroundColor Yellow
Write-Host "Source: $SourceRoot" -ForegroundColor Yellow
Write-Host "Golden: $GoldenRoot" -ForegroundColor Yellow
Write-Host ""

$allFixtures = @{}

# Helper: run magick with args and fail on error
function Run-Magick($ArgumentList) {
  $display = $ArgumentList -join ' '
  Write-Host "  magick $display" -ForegroundColor Gray
  & $MagickExe $ArgumentList 2>&1
  if ($LASTEXITCODE -ne 0) { throw "magick failed (exit $LASTEXITCODE): magick $display" }
}

# Helper: generate a golden fixture for one operation/source combo
function New-Golden($Operation, $SourceFile, $ExtraArgs, $OutputName) {
  $opDir = Join-Path $GoldenRoot $Operation
  if (-not (Test-Path $opDir)) { New-Item -ItemType Directory -Path $opDir -Force | Out-Null }
  $inputPath = Join-Path $SourceRoot $SourceFile
  $outPath = Join-Path $opDir $OutputName
  $argsList = @($inputPath) + $ExtraArgs + @("-depth", "8", "-define", "png:color-type=2", $outPath)
  Run-Magick $argsList
  $relPath = "test/fixtures/golden/$Operation/$OutputName"
  $allFixtures[$relPath.Replace('\', '/')] = ($argsList -join ' ')
}

function Gen-AllSources($Operation, $ExtraArgs, $OutputNamePattern) {
  foreach ($src in $Sources) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($src)
    $outName = $OutputNamePattern.Replace('{base}', $base)
    New-Golden $Operation $src $ExtraArgs $outName
  }
}

# --- RESIZE ---
Write-Host "-- resize --" -ForegroundColor Green
Gen-AllSources "resize" @("-resize", "50x50") "{base}-50x50.png"

# --- ROTATE ---
Write-Host "-- rotate --" -ForegroundColor Green
Gen-AllSources "rotate" @("-rotate", "90") "{base}-90.png"

# --- ROTATE 180 ---
Write-Host "-- rotate 180 --" -ForegroundColor Green
Gen-AllSources "rotate" @("-rotate", "180") "{base}-180.png"

# --- ROTATE -90 ---
Write-Host "-- rotate -90 --" -ForegroundColor Green
Gen-AllSources "rotate" @("-rotate", "-90") "{base}-m90.png"

# --- FLIP ---
Write-Host "-- flip --" -ForegroundColor Green
Gen-AllSources "flip" @("-flip") "{base}.png"

# --- FLOP ---
Write-Host "-- flop --" -ForegroundColor Green
Gen-AllSources "flop" @("-flop") "{base}.png"

# --- AUTO-ORIENT ---
Write-Host "-- auto-orient --" -ForegroundColor Green
Gen-AllSources "auto-orient" @("-auto-orient") "{base}.png"

# --- DESKEW ---
Write-Host "-- deskew --" -ForegroundColor Green
Gen-AllSources "deskew" @("-deskew", "20%") "{base}.png"

# --- EXTENT ---
Write-Host "-- extent --" -ForegroundColor Green
Gen-AllSources "extent" @("-gravity", "Center", "-background", "#ffffff", "-extent", "120x120") "{base}-120x120-center-white.png"

# --- BORDER ---
Write-Host "-- border --" -ForegroundColor Green
Gen-AllSources "border" @("-bordercolor", "#e74c3c", "-border", "5x5") "{base}-5px-red.png"

# --- MODULATE ---
Write-Host "-- modulate --" -ForegroundColor Green
Gen-AllSources "modulate" @("-modulate", "120,150,110") "{base}.png"

# --- BRIGHTNESS-CONTRAST ---
Write-Host "-- brightness-contrast --" -ForegroundColor Green
Gen-AllSources "brightness-contrast" @("-brightness-contrast", "0,30") "{base}.png"

# --- NORMALIZE ---
Write-Host "-- normalize --" -ForegroundColor Green
Gen-AllSources "normalize" @("-normalize") "{base}.png"

# --- AUTO-LEVEL ---
Write-Host "-- auto-level --" -ForegroundColor Green
Gen-AllSources "auto-level" @("-auto-level") "{base}.png"

# --- LEVELS ---
Write-Host "-- levels --" -ForegroundColor Green
Gen-AllSources "levels" @("-level", "10%,90%,1.2") "{base}-all.png"

# --- THRESHOLD ---
Write-Host "-- threshold --" -ForegroundColor Green
Gen-AllSources "threshold" @("-threshold", "60%") "{base}.png"

# --- SIGMOIDAL-CONTRAST ---
Write-Host "-- sigmoidal-contrast --" -ForegroundColor Green
Gen-AllSources "sigmoidal-contrast" @("-sigmoidal-contrast", "5,50") "{base}.png"

# --- COLOR-SPACE ---
Write-Host "-- color-space --" -ForegroundColor Green
Gen-AllSources "color-space" @("-colorspace", "Gray") "{base}-gray.png"

# --- COLOR-SPACE HSL ---
Write-Host "-- color-space HSL --" -ForegroundColor Green
Gen-AllSources "color-space" @("-colorspace", "HSL") "{base}-hsl.png"

# --- COLOR-SPACE HSV ---
Write-Host "-- color-space HSV --" -ForegroundColor Green
Gen-AllSources "color-space" @("-colorspace", "HSV") "{base}-hsv.png"

# --- COLOR-SPACE Lab ---
Write-Host "-- color-space Lab --" -ForegroundColor Green
Gen-AllSources "color-space" @("-colorspace", "Lab") "{base}-lab.png"

# --- GRAYSCALE ---
Write-Host "-- grayscale --" -ForegroundColor Green
Gen-AllSources "grayscale" @("-grayscale", "Rec709Luminance") "{base}.png"

# --- SEPIA-TONE ---
Write-Host "-- sepia-tone --" -ForegroundColor Green
Gen-AllSources "sepia-tone" @("-sepia-tone", "80%") "{base}.png"

# --- CHARCOAL ---
Write-Host "-- charcoal --" -ForegroundColor Green
Gen-AllSources "charcoal" @("-charcoal", "2") "{base}-radius2.png"

# --- NEGATE ---
Write-Host "-- negate --" -ForegroundColor Green
Gen-AllSources "negate" @("-channel", "RGB", "-negate") "{base}.png"

# --- CANNY-EDGE ---
Write-Host "-- canny-edge --" -ForegroundColor Green
Gen-AllSources "canny-edge" @("-canny", "2x0.75+10%+30%") "{base}.png"

# --- OIL-PAINT ---
Write-Host "-- oil-paint --" -ForegroundColor Green
Gen-AllSources "oil-paint" @("-paint", "3") "{base}.png"

# --- SOLARIZE ---
Write-Host "-- solarize --" -ForegroundColor Green
Gen-AllSources "solarize" @("-channel", "RGB", "-solarize", "50%") "{base}.png"

# --- BILATERAL-BLUR ---
Write-Host "-- bilateral-blur --" -ForegroundColor Green
Gen-AllSources "bilateral-blur" @("-bilateral-blur", "5x5+1.5+1.0") "{base}.png"

# --- BLUR ---
Write-Host "-- blur --" -ForegroundColor Green
Gen-AllSources "blur" @("-blur", "3x1.5") "{base}.png"

# --- SHARPEN ---
Write-Host "-- sharpen --" -ForegroundColor Green
Gen-AllSources "sharpen" @("-sharpen", "2x1") "{base}.png"

# --- STRIP ---
Write-Host "-- strip --" -ForegroundColor Green
Gen-AllSources "strip" @("-strip") "{base}.png"

# --- FORMAT CONVERSION ---
Write-Host "-- format-conversion --" -ForegroundColor Green
foreach ($src in $Sources) {
  $base = [System.IO.Path]::GetFileNameWithoutExtension($src)
  New-Golden "format-conversion" $src @("-quality", "85") "${base}-to-webp.webp"
  New-Golden "format-conversion" $src @("-quality", "85") "${base}-to-jpeg.jpg"
}

# --- QUALITY ---
Write-Host "-- quality --" -ForegroundColor Green
Gen-AllSources "quality" @("-quality", "75") "{base}-q75.jpg"

# --- Update manifest.json ---
Write-Host "" -ForegroundColor Cyan
Write-Host "=== Updating manifest.json ===" -ForegroundColor Cyan
$manifest = Get-Content $ManifestFile -Raw | ConvertFrom-Json
$manifest.fixtures = $allFixtures
$manifest.generated = (Get-Date -Format "yyyy-MM-dd")
$manifest | ConvertTo-Json -Depth 5 | Set-Content $ManifestFile -Encoding UTF8
Write-Host "Manifest updated with $($allFixtures.Count) fixture entries" -ForegroundColor Green
Write-Host "=== Done ===" -ForegroundColor Cyan
