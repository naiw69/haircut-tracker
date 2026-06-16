# generate-icons.ps1
# Requires System.Drawing. Load the assembly.
Add-Type -AssemblyName System.Drawing

$scriptPath = $PSScriptRoot
$sourcePath = Join-Path $scriptPath "public\logo.png"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source logo file not found at $sourcePath"
    exit 1
}

Write-Output "Loading source image from $sourcePath..."
$srcImage = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image {
    param (
        [System.Drawing.Image]$sourceImage,
        [int]$width,
        [int]$height,
        [string]$destinationPath
    )

    Write-Output "Generating: $destinationPath ($($width)x$($height))..."
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($destBitmap)
    
    # Configure high-quality rendering options
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($sourceImage, 0, 0, $width, $height)
    $g.Dispose()
    
    $destBitmap.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
}

function Create-Maskable-Image {
    param (
        [System.Drawing.Image]$sourceImage,
        [int]$size,
        [string]$destinationPath
    )

    Write-Output "Generating Maskable: $destinationPath ($($size)x$($size))..."
    $destBitmap = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($destBitmap)
    
    # Background color for the safe zone margin of maskable icon (White)
    $g.Clear([System.Drawing.Color]::White)
    
    # Configure high-quality rendering options
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Scale down to 60% of the image size to stay within the safe zone circle
    $scaledSize = [int]($size * 0.60)
    $offset = [int](($size - $scaledSize) / 2)
    
    $g.DrawImage($sourceImage, $offset, $offset, $scaledSize, $scaledSize)
    $g.Dispose()
    
    $destBitmap.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
}

# Define destination paths
$dest192 = Join-Path $scriptPath "public\pwa-192x192.png"
$dest512 = Join-Path $scriptPath "public\pwa-512x512.png"
$mask192 = Join-Path $scriptPath "public\pwa-maskable-192x192.png"
$mask512 = Join-Path $scriptPath "public\pwa-maskable-512x512.png"

# Execute resizing operations
Resize-Image -sourceImage $srcImage -width 192 -height 192 -destinationPath $dest192
Resize-Image -sourceImage $srcImage -width 512 -height 512 -destinationPath $dest512
Create-Maskable-Image -sourceImage $srcImage -size 192 -destinationPath $mask192
Create-Maskable-Image -sourceImage $srcImage -size 512 -destinationPath $mask512

$srcImage.Dispose()
Write-Output "All icons successfully generated in public directory!"
