# Script pour lancer l'agent de test du parcours adhésion
# Usage: .\run_adhesion_test.ps1 [type_adhesion] [api_url]
# Exemples:
#   .\run_adhesion_test.ps1                          # Test individual sur localhost
#   .\run_adhesion_test.ps1 professional             # Test professional sur localhost
#   .\run_adhesion_test.ps1 individual https://etf-backend-t3j5.onrender.com  # Test sur prod

param(
    [string]$MembershipType = "individual",
    [string]$ApiUrl = "http://localhost:8001"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Agent de Test du Parcours Adhesion" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que l'environnement virtuel est activé
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Activation de l'environnement virtuel..." -ForegroundColor Yellow
    & "$PSScriptRoot\.venv\Scripts\Activate.ps1"
}

# Aller dans le dossier backend
Set-Location "$PSScriptRoot\backend"

Write-Host "Configuration:" -ForegroundColor Green
Write-Host "  - Type d'adhesion: $MembershipType" -ForegroundColor White
Write-Host "  - API URL: $ApiUrl" -ForegroundColor White
Write-Host ""

# Lancer le test
Write-Host "Lancement du test..." -ForegroundColor Yellow
Write-Host ""

python adhesion_test_agent.py $ApiUrl $MembershipType

Write-Host ""
Write-Host "Test termine!" -ForegroundColor Green
