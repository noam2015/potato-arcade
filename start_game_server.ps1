# Local HTTP Server for Potato Arcade
# Runs on Port 8000

$port = 8000
$localPath = Get-Location
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host " Potato Arcade Server is running!" -ForegroundColor Green
    Write-Host " Open your browser and navigate to:" -ForegroundColor Cyan
    Write-Host " http://localhost:$port" -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "Press Ctrl+C in this window to stop the server."
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.Trim('/')
        if ([string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "index.html"
        }

        # Decode URL special characters like spaces
        $urlPath = [Uri]::UnescapeDataString($urlPath)
        
        $filePath = Join-Path $localPath $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            # Set content types
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "application/octet-stream"
            switch ($ext) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".css"  { $contentType = "text/css; charset=utf-8" }
                ".js"   { $contentType = "application/javascript; charset=utf-8" }
                ".png"  { $contentType = "image/png" }
                ".jpg"  { $contentType = "image/jpeg" }
                ".jpeg" { $contentType = "image/jpeg" }
                ".ico"  { $contentType = "image/x-icon" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $html = "<html><body><h1>404 File Not Found</h1><p>Could not find file: $urlPath</p></body></html>"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($html)
            $response.ContentType = "text/html; charset=utf-8"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $response.Close()
    } catch {
        # Catch connection resets silently
    }
}
