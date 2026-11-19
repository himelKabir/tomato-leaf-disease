@echo off
rem Starts the Tomato Leaf Check web app and opens it in the browser.
rem   Double-click this file, or type  run-app  in a terminal in this folder.
rem   run-app phone   also lets a phone on the same Wi-Fi open the app.
rem Stop the app with Ctrl+C, or close this window.

setlocal
cd /d "%~dp0app"

set APP_HOST=127.0.0.1
if /i "%~1"=="phone" set APP_HOST=0.0.0.0

echo [1/3] Checking the Python packages...
python -c "import fastapi, uvicorn, multipart, PIL, numpy, scipy, torch, torchvision" 2>nul
if errorlevel 1 (
  echo Installing the Python packages, first time only. This can take a few minutes...
  python -m pip install -r backend\requirements.txt
  if errorlevel 1 goto :failed
)

echo [2/3] Building the web page...
pushd frontend
if not exist node_modules (
  echo Installing the frontend packages, first time only...
  call npm install
  if errorlevel 1 (popd & goto :failed)
)
call npm run build --silent
if errorlevel 1 (popd & goto :failed)
popd

echo [3/3] Starting the app...
echo.
echo   Open:   http://localhost:8000
if "%APP_HOST%"=="0.0.0.0" powershell -NoProfile -Command "Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway } | ForEach-Object { '  Phone:  http://' + $_.IPv4Address[0].IPAddress + ':8000   (phone on the same Wi-Fi)' }"
echo   Stop:   press Ctrl+C, or close this window
echo.

rem Open the browser as soon as the server answers.
start "" /b powershell -NoProfile -Command "for ($i = 0; $i -lt 120; $i++) { try { Invoke-WebRequest http://127.0.0.1:8000/api/health -UseBasicParsing -TimeoutSec 1 | Out-Null; Start-Process 'http://localhost:8000'; break } catch { Start-Sleep -Milliseconds 500 } }"

cd backend
python -m uvicorn main:app --host %APP_HOST% --port 8000
if errorlevel 1 goto :failed
goto :eof

:failed
echo.
echo Something went wrong, see the messages above.
echo - The app needs Python 3.11+ and Node.js 20+.
echo - If it says the address or port is in use, the app is already running in another window.
pause
exit /b 1
