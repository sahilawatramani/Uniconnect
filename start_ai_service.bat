@echo off
color 0A
echo ===================================================
echo     UNICONNECT AI SERVICE STARTUP SCRIPT
echo ===================================================
echo.
echo Starting the Python FastAPI server...
start "UniConnect AI Service (DO NOT CLOSE)" cmd /k "cd ai-service && title UniConnect AI Service && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo Waiting 3 seconds for server to boot...
timeout /t 3 /nobreak >nul

echo Configuring Ngrok Authtoken...
.\ngrok.exe config add-authtoken 3ByUGccHf8SGsxVlRSqa3mWxtEL_5wBZP8hYFLDPdTvxkinCW

echo Starting Ngrok Tunnel...
start "Ngrok Tunnel (DO NOT CLOSE)" cmd /k "title Ngrok Tunnel && .\ngrok.exe http --domain=formalistic-political-cortney.ngrok-free.dev 127.0.0.1:8000"

echo.
echo ===================================================
echo                   SUCCESS!
echo ===================================================
echo Two command windows have opened. Do not close them!
echo.
echo YOUR AI SERVICE IS LIVE!
echo Your permanent Ngrok URL is routing traffic securely.
echo You no longer need to update 'render.yaml' daily!
echo.
pause
