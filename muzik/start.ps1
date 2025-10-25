Write-Host "🎵 Starting Muzik App..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Installing dependencies if needed..." -ForegroundColor Yellow
npm install
Set-Location server
npm install
Set-Location ..
Write-Host ""
Write-Host "Starting both servers..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor Blue
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host ""
npm run dev:all
