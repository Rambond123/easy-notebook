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

# Confirme o limite antes de limpar a pasta temporária de empacotamento.
if ([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($stageDir)) -ne $outputDir) {
    throw 'A pasta temporária deve estar dentro da pasta de saída.'
}

$runtimeFiles = @(
    'background.js', 'configuration.js', 'content.js', 'db.js',
    'direct-upload-controller.js', 'gaia-page.js', 'gaia-import.js', 'gaia-options.js', 'eproc-capture.js',
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
    # Quem abre o HTML extraído já concluiu download e extração.
    # Gere o guia local com somente as etapas de instalação do mesmo site.
    $guide = [IO.File]::ReadAllText((Join-Path $repoDir 'docs/index.html'))
    if ($guide -notmatch '<!-- DOWNLOAD-STEPS-START -->' -or $guide -notmatch '<!-- DOWNLOAD-STEPS-END -->') {
        throw 'Nao foi possivel separar as etapas de download do guia.'
    }
    $guide = [regex]::Replace($guide, '(?s)<!-- DOWNLOAD-STEPS-START -->.*?<!-- DOWNLOAD-STEPS-END -->', '')
    $guide = $guide.Replace('<!-- INSTALL-HEADING -->', '<p class="tip">Voc&#234; j&#225; extraiu os arquivos. Agora vamos instalar a extens&#227;o no Chrome.</p>')
    $guide = [regex]::Replace($guide, '(?s)<noscript>.*?</noscript>', '<noscript><p>No Chrome, abra chrome://extensions, ative Modo do desenvolvedor e clique em Carregar sem compacta&#231;&#227;o. Selecione a pasta Easy Notebook que est&#225; ao lado deste arquivo.</p></noscript>')
    $guide = [regex]::Replace($guide, 'J.{1} baixei', 'Abri a tela de extensoes')
    [IO.File]::WriteAllText((Join-Path $stageDir '1 - INSTALAR NO CHROME.html'), $guide, [Text.UTF8Encoding]::new($false))

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
