@echo off
setlocal
title Easy Notebook - Instalacao

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalador\instalar.ps1"
if errorlevel 1 (
  echo.
  echo Nao foi possivel concluir a instalacao.
  echo Anote a mensagem acima e envie para quem forneceu a extensao.
  pause
)

endlocal
