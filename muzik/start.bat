@echo off
echo Starting Muzik App...
echo.
echo Installing dependencies if needed...
call npm install
call cd server && npm install
echo.
echo Starting both servers...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
call npm run dev:all
pause
