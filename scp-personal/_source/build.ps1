param(
  [string]$Template = "$PSScriptRoot\index.template.html",
  [string]$Output   = "$(Split-Path $PSScriptRoot -Parent)\scp-personal-wiki.html"
)

$assets = Join-Path $PSScriptRoot "assets"
$map = [ordered]@{
  '__BODY_BG__'      = 'body_bg.png'
  '__LOGO__'         = 'logo.png'
  '__LOGO250__'      = 'logo_250.png'
  '__ICON_HELP__'    = 'help.png'
  '__ICON_MAIN__'    = 'main.png'
  '__ICON_DEFAULT__' = 'default.png'
  '__ICON_SERIES__'  = 'series.png'
  '__ICON_FORUM__'   = 'forum.png'
}

$html = [System.IO.File]::ReadAllText($Template, [System.Text.Encoding]::UTF8)

foreach ($key in $map.Keys) {
  $path = Join-Path $assets $map[$key]
  if (-not (Test-Path $path)) { throw "Missing asset: $path" }
  $b64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($path))
  $html = $html.Replace($key, "data:image/png;base64,$b64")
}

$leftover = [regex]::Matches($html, '__[A-Z0-9_]+__') | ForEach-Object { $_.Value } | Sort-Object -Unique
if ($leftover) { Write-Warning ("Unreplaced placeholders: " + ($leftover -join ', ')) }

[System.IO.File]::WriteAllText($Output, $html, (New-Object System.Text.UTF8Encoding($false)))
$size = (Get-Item $Output).Length
Write-Host ("Built: {0}" -f $Output)
Write-Host ("Size : {0:N0} bytes ({1:N1} KB)" -f $size, ($size / 1KB))
