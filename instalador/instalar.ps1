param(
    [string]$DocumentsPath,
    [switch]$SkipLaunch
)

$ErrorActionPreference = 'Stop'

try {
    $sourceDir = Split-Path -Parent $PSScriptRoot
    $documentsDir = if ([string]::IsNullOrWhiteSpace($DocumentsPath)) {
        [Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)
    } else {
        $DocumentsPath
    }
    if ([string]::IsNullOrWhiteSpace($documentsDir)) {
        throw 'O Windows nao informou a pasta Documentos deste usuario.'
    }

    $targetDir = Join-Path $documentsDir 'Eprocando\Easy Notebook'
    $manifestPath = Join-Path $sourceDir 'manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        throw 'O arquivo manifest.json nao foi encontrado. Extraia todo o ZIP antes de executar o instalador.'
    }

    $runtimeFiles = @(
        'background.js',
        'configuration.js',
        'content.js',
        'db.js',
        'direct-upload-controller.js',
        'drive.js',
        'eproc-capture.js',
        'eproc-generation.js',
        'eproc-toolbar.js',
        'extension-session.js',
        'manifest.json',
        'notebook-direct-upload.js',
        'notebook-page-upload.js',
        'notebook-upload.js',
        'options.html',
        'options.js',
        'page-scope.js',
        'panel-position.js',
        'panel-ui.js',
        'setup-controller.js',
        'transfer.html',
        'transfer.js',
        'ui.css',
        'wizard.css',
        'wizard.html',
        'wizard.js'
    )

    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $targetDir 'icons') -Force | Out-Null

    foreach ($relativePath in $runtimeFiles) {
        $sourcePath = Join-Path $sourceDir $relativePath
        if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
            throw "Falta um arquivo da extensao: $relativePath"
        }
        Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $targetDir $relativePath) -Force
    }

    Copy-Item -Path (Join-Path $sourceDir 'icons\*') -Destination (Join-Path $targetDir 'icons') -Force

    $guideTemplatePath = Join-Path $PSScriptRoot 'guia-instalacao.html'
    $guideTargetPath = Join-Path $targetDir 'COMO INSTALAR.html'
    $encodedPath = [System.Net.WebUtility]::HtmlEncode($targetDir)
    $pathAsJson = ConvertTo-Json $targetDir -Compress
    $guide = Get-Content -LiteralPath $guideTemplatePath -Raw -Encoding UTF8
    $guide = $guide.Replace('{{INSTALL_PATH_HTML}}', $encodedPath).Replace('{{INSTALL_PATH_JSON}}', $pathAsJson)
    [System.IO.File]::WriteAllText($guideTargetPath, $guide, [System.Text.UTF8Encoding]::new($false))

    Set-Clipboard -Value $targetDir

    if ($SkipLaunch) {
        Write-Host ''
        Write-Host 'Easy Notebook preparada com sucesso.' -ForegroundColor Green
        Write-Host "Pasta: $targetDir"
        exit 0
    }

    $chromeCandidates = @(
        (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
        (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    $chromeExe = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1

    if (-not $chromeExe) {
        $chromeCommand = Get-Command chrome.exe -ErrorAction SilentlyContinue
        if ($chromeCommand) { $chromeExe = $chromeCommand.Source }
    }
    if (-not $chromeExe) {
        throw "O Google Chrome nao foi encontrado. A extensao foi copiada para $targetDir, mas a instalacao precisa ser concluida no Chrome."
    }

    Start-Process -FilePath $chromeExe -ArgumentList 'chrome://extensions/'
    Start-Sleep -Milliseconds 700
    Start-Process -FilePath $chromeExe -ArgumentList ([Uri]$guideTargetPath).AbsoluteUri

    Write-Host ''
    Write-Host 'Easy Notebook preparada com sucesso.' -ForegroundColor Green
    Write-Host "Pasta: $targetDir"
    Write-Host 'O caminho ja esta copiado. Siga o guia visual aberto no Chrome.'
    Start-Sleep -Seconds 3
}
catch {
    Write-Host ''
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
