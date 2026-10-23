@echo off
setlocal
title Easy Notebook - Instalacao

set "EASY_NOTEBOOK_FILES=%~dp0Arquivos Easy Notebook"
set "EASY_NOTEBOOK_SCRIPT=%EASY_NOTEBOOK_FILES%\instalador\instalar.ps1"

if not exist "%EASY_NOTEBOOK_SCRIPT%" (
  cls
  echo ================================================================
  echo               ANTES DE INSTALAR: EXTRAIA O ZIP
  echo ================================================================
  echo.
  echo Volte para a janela anterior e clique em EXTRAIR TUDO.
  echo Depois abra a pasta extraida e execute novamente:
  echo.
  echo     1 - INSTALAR EASY NOTEBOOK.cmd
  echo.
  echo Nao execute este arquivo diretamente de dentro do ZIP.
  echo ================================================================
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%EASY_NOTEBOOK_SCRIPT%"
if errorlevel 1 (
  echo.
  echo Nao foi possivel concluir a instalacao.
  echo Anote a mensagem acima e envie para quem forneceu a extensao.
  pause
)

endlocal
