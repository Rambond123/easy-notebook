param(
    [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'

$repoDir = Split-Path -Parent $PSScriptRoot
$manifest = Get-Content -LiteralPath (Join-Path $repoDir 'manifest.json') -Raw | ConvertFrom-Json
$version = [string]$manifest.version

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $repoDir 'pacotes'
}

$outputDir = [System.IO.Path]::GetFullPath($OutputDirectory)
$stageDir = Join-Path $outputDir ".stage-$version"
$zipPath = Join-Path $outputDir "Easy-Notebook-$version.zip"
$payloadDir = Join-Path $stageDir 'Easy Notebook'

$runtimeFiles = @(
    'background.js', 'configuration.js', 'content.js', 'db.js',
    'direct-upload-controller.js', 'drive.js', 'eproc-capture.js',
    'eproc-generation.js', 'eproc-toolbar.js', 'extension-session.js',
    'manifest.json', 'notebook-direct-upload.js', 'notebook-page-upload.js',
    'notebook-upload.js', 'options.html', 'options.js', 'page-scope.js',
    'panel-position.js', 'panel-ui.js', 'setup-controller.js', 'transfer.html',
    'transfer.js', 'ui.css', 'wizard.css', 'wizard.html', 'wizard.js'
)

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
if (Test-Path -LiteralPath $stageDir) { Remove-Item -LiteralPath $stageDir -Recurse -Force }
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
New-Item -ItemType Directory -Path $payloadDir -Force | Out-Null

try {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '0 - COMECE AQUI.html') -Destination $stageDir

    foreach ($relativePath in $runtimeFiles) {
        Copy-Item -LiteralPath (Join-Path $repoDir $relativePath) -Destination (Join-Path $payloadDir $relativePath)
    }
    Copy-Item -LiteralPath (Join-Path $repoDir 'icons') -Destination $payloadDir -Recurse
    Compress-Archive -Path (Join-Path $stageDir '*') -DestinationPath $zipPath -CompressionLevel Optimal
    Write-Output $zipPath
}
finally {
    if (Test-Path -LiteralPath $stageDir) { Remove-Item -LiteralPath $stageDir -Recurse -Force }
}
