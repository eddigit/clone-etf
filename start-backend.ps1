# Démarrage du Backend uniquement
Write-Host "Démarrage du Backend FastAPI..." -ForegroundColor Cyan
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
