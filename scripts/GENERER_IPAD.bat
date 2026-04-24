@echo off
REM Double-cliquez ce fichier pour generer les screenshots iPad 13"
REM Placez d'abord vos screenshots iPhone dans le dossier "input-iphone"

cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0make-ipad-screenshots.ps1"
pause
