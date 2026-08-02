# Local HTTP Server for Potato Arcade using TcpListener
# Enables sharing across local networks (Wi-Fi) without requiring admin privileges

$port = 8000
$localPath = Get-Location

# Get local IPv4 address for network sharing
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress

$started = $false
while (-not $started) {
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
        $listener.Start()
        $started = $true
    } catch {
        Write-Host "Port $port is in use, trying port $($port + 1)..." -ForegroundColor Yellow
        $port++
        if ($port -gt 8020) {
            Write-Host "Error: Could not find an open port between 8000 and 8020." -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit
        }
    }
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host " Potato Arcade Server is running!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host " Access from this computer:" -ForegroundColor Cyan
Write-Host " http://localhost:$port" -ForegroundColor Yellow
if ($localIp) {
    Write-Host ""
    Write-Host " Access from other devices on the same Wi-Fi:" -ForegroundColor Cyan
    Write-Host " http://$localIp`:$port" -ForegroundColor Yellow
}
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Press Ctrl+C in this window to stop the server."

# Helper to map extensions to MIME types
function Get-MimeType($ext) {
    switch ($ext.ToLower()) {
        ".html" { return "text/html; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif"  { return "image/gif" }
        ".svg"  { return "image/svg+xml" }
        ".ico"  { return "image/x-icon" }
        ".json" { return "application/json; charset=utf-8" }
        ".mp3"  { return "audio/mpeg" }
        ".wav"  { return "audio/wav" }
        default { return "application/octet-stream" }
    }
}

try {
    while ($true) {
        try {
            if (-not $listener.Pending()) {
                Start-Sleep -Milliseconds 50
                continue
            }
            
            $client = $listener.AcceptTcpClient()
            $stream = $client.GetStream()
            
            # Read the request headers (limit to first 10KB)
            $buffer = New-Object System.Byte[] 10240
            $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
            if ($bytesRead -eq 0) {
                $stream.Close()
                $client.Close()
                continue
            }
            $requestString = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
            
            if ($requestString -match "GET /(.*?) HTTP/1.1") {
                $urlPath = $Matches[1].Split('?')[0]
                if ([string]::IsNullOrEmpty($urlPath)) {
                    $urlPath = "index.html"
                }
                
                # Decode URL special characters like spaces
                $urlPath = [Uri]::UnescapeDataString($urlPath).Trim('/')
                
                # Log client errors if any
                if ($urlPath -eq "log-error" -and $requestString -match "msg=(.*?)\sHTTP") {
                    $msg = [Uri]::UnescapeDataString($Matches[1])
                    Write-Host "[Client Error] $msg" -ForegroundColor Red
                    
                    # Send simple HTTP 200 response
                    $responseStr = "HTTP/1.1 200 OK`r`nContent-Length: 6`r`nContent-Type: text/plain; charset=utf-8`r`nConnection: close`r`n`r`nLogged"
                    $responseBytes = [System.Text.Encoding]::UTF8.GetBytes($responseStr)
                    $stream.Write($responseBytes, 0, $responseBytes.Length)
                } else {
                    $filePath = Join-Path $localPath $urlPath
                    
                    # Prevent directory traversal (ensure file is within localPath)
                    $resolvedPath = [System.IO.Path]::GetFullPath($filePath)
                    $rootFullPath = [System.IO.Path]::GetFullPath($localPath)
                    
                    if ($resolvedPath.StartsWith($rootFullPath) -and (Test-Path $filePath -PathType Leaf)) {
                        $ext = [System.IO.Path]::GetExtension($filePath)
                        $contentType = Get-MimeType $ext
                        
                        $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                        
                        $headers = "HTTP/1.1 200 OK`r`n" +
                                   "Content-Type: $contentType`r`n" +
                                   "Content-Length: $($fileBytes.Length)`r`n" +
                                   "Connection: close`r`n`r`n"
                        
                        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                        $stream.Write($headerBytes, 0, $headerBytes.Length)
                        $stream.Write($fileBytes, 0, $fileBytes.Length)
                    } else {
                        $html = "<html><body><h1>404 File Not Found</h1><p>Could not find file: $urlPath</p></body></html>"
                        $htmlBytes = [System.Text.Encoding]::UTF8.GetBytes($html)
                        $headers = "HTTP/1.1 404 Not Found`r`n" +
                                   "Content-Type: text/html; charset=utf-8`r`n" +
                                   "Content-Length: $($htmlBytes.Length)`r`n" +
                                   "Connection: close`r`n`r`n"
                        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                        $stream.Write($headerBytes, 0, $headerBytes.Length)
                        $stream.Write($htmlBytes, 0, $htmlBytes.Length)
                    }
                }
            }
            
            $stream.Close()
            $client.Close()
        } catch {
            # Catch individual connection errors and keep loop running
            if ($null -ne $stream) { $stream.Close() }
            if ($null -ne $client) { $client.Close() }
        }
    }
} finally {
    $listener.Stop()
}
