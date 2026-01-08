# Script de démarrage local pour Windows PowerShell
# En Toute Franchise - Plateforme Associative

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  En Toute Franchise - Démarrage" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si MongoDB est en cours d'exécution
Write-Host "Vérification de MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if (-not $mongoProcess) {
    Write-Host "⚠️  MongoDB n'est pas démarré!" -ForegroundColor Red
    Write-Host "Veuillez démarrer MongoDB avec: mongod --dbpath=<chemin_vers_data>" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Voulez-vous continuer quand même? (o/n)"
    if ($continue -ne "o") {
        exit
    }
} else {
    Write-Host "✓ MongoDB est actif" -ForegroundColor Green
}

Write-Host ""
Write-Host "Démarrage du Backend (FastAPI)..." -ForegroundColor Yellow

# Démarrer le backend dans une nouvelle fenêtre PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Backend FastAPI' -ForegroundColor Cyan; python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001"

Start-Sleep -Seconds 3

Write-Host "✓ Backend démarré sur http://localhost:8001" -ForegroundColor Green
Write-Host ""
Write-Host "Démarrage du Frontend (React)..." -ForegroundColor Yellow

# Démarrer le frontend dans une nouvelle fenêtre PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Frontend React' -ForegroundColor Cyan; npm start"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  🚀 Application démarrée!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8001" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comptes de test:" -ForegroundColor Yellow
Write-Host "  User: test@example.fr / password123" -ForegroundColor White
Write-Host "  Admin: admin@example.fr / admin123" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour quitter..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
