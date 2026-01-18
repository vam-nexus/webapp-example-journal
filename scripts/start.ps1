param(
  [switch]$Install
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path "$root\.."

function Ensure-NodeModules($path) {
  if ($Install -or -not (Test-Path (Join-Path $path "node_modules"))) {
    Push-Location $path
    npm install
    Pop-Location
  }
}

Ensure-NodeModules (Join-Path $repo "frontend\web")
Ensure-NodeModules (Join-Path $repo "frontend\app")

$backendCmd = "cd `"$repo`"; uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
$webCmd = "cd `"$repo\frontend\web`"; npm run dev"
$appCmd = "cd `"$repo\frontend\app`"; npm run dev"

Start-Process -FilePath "pwsh" -ArgumentList "-NoExit", "-Command", $backendCmd
Start-Process -FilePath "pwsh" -ArgumentList "-NoExit", "-Command", $webCmd
Start-Process -FilePath "pwsh" -ArgumentList "-NoExit", "-Command", $appCmd
