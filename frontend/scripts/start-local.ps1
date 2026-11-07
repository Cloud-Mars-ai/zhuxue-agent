param(
  [int]$Port = 5173,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

$frontendDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$entryUrl = "http://127.0.0.1:$Port/"
$healthUrl = "http://127.0.0.1:$Port/"

function Test-LocalApp {
  try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
    return (
      $response.StatusCode -ge 200 -and
      $response.StatusCode -lt 500 -and
      $response.Content -match '/src/main.js'
    )
  } catch {
    return $false
  }
}

function Open-Project {
  if ($NoBrowser) {
    Write-Host "Local project is running: $entryUrl"
    return
  }
  Start-Process $entryUrl
}

if (Test-LocalApp) {
  Write-Host "The local project is already running. Opening: $entryUrl"
  Open-Project
  exit 0
}

Set-Location -LiteralPath $frontendDir

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $nodeCommand -or -not $npmCommand) {
  Write-Error 'Node.js / npm was not found. Install Node.js 22 or newer first.'
  exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendDir 'node_modules'))) {
  Write-Host 'First launch: installing dependencies...'
  & $npmCommand.Source install
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'Dependency installation failed. Check the network or npm settings.'
    exit $LASTEXITCODE
  }
}

$safeDir = $frontendDir.Replace("'", "''")
$serverCommand = @"
`$Host.UI.RawUI.WindowTitle = 'Jingguan Agent Local Server'
`$env:PORT = '$Port'
Set-Location -LiteralPath '$safeDir'
Write-Host 'Starting Jingguan Agent: $entryUrl'
Write-Host 'Close this window to stop the local server.'
npm run dev -- --strictPort
"@

Start-Process `
  -FilePath 'powershell.exe' `
  -ArgumentList @('-NoLogo', '-NoProfile', '-NoExit', '-Command', $serverCommand) `
  -WindowStyle Normal

Write-Host "Waiting for the local server: $entryUrl"
$ready = $false
for ($attempt = 0; $attempt -lt 45; $attempt += 1) {
  Start-Sleep -Milliseconds 750
  if (Test-LocalApp) {
    $ready = $true
    break
  }
}

if (-not $ready) {
  Write-Error 'The local server did not start in time. Check the new server window for errors.'
  exit 1
}

Write-Host "Local project is ready: $entryUrl"
Open-Project
