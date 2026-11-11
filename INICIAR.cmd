@echo off
setlocal
cd /d "%~dp0"
set "CONTENT_OS_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "CONTENT_OS_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%CONTENT_OS_NODE%" if not "%CONTENT_OS_NODE%"=="node" goto missing
"%CONTENT_OS_NODE%" scripts\build.mjs
if errorlevel 1 goto failed
start "" http://127.0.0.1:4173
"%CONTENT_OS_NODE%" scripts\serve.mjs
goto :eof
:missing
echo Hace falta Node.js 22 o superior. Instalar desde https://nodejs.org/
pause
goto :eof
:failed
echo No se pudo iniciar CONTENT OS. Revisar el error anterior.
pause
