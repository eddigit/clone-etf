# Script de vérification de l'environnement
# En Toute Franchise

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Vérification de l'Environnement" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Vérifier Python
Write-Host "Vérification Python..." -NoNewline
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python 3\.(1[1-9]|[2-9]\d)") {
        Write-Host " ✓" -ForegroundColor Green
        Write-Host "  $pythonVersion" -ForegroundColor Gray
    } else {
        Write-Host " ⚠" -ForegroundColor Yellow
        Write-Host "  $pythonVersion (Version 3.11+ recommandée)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "  Python n'est pas installé!" -ForegroundColor Red
    $allGood = $false
}

# Vérifier Node.js
Write-Host "Vérification Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>&1
    if ($nodeVersion -match "v(1[8-9]|[2-9]\d)") {
        Write-Host " ✓" -ForegroundColor Green
        Write-Host "  $nodeVersion" -ForegroundColor Gray
    } else {
        Write-Host " ⚠" -ForegroundColor Yellow
        Write-Host "  $nodeVersion (Version 18+ recommandée)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "  Node.js n'est pas installé!" -ForegroundColor Red
    $allGood = $false
}

# Vérifier npm
Write-Host "Vérification npm..." -NoNewline
try {
    $npmVersion = npm --version 2>&1
    Write-Host " ✓" -ForegroundColor Green
    Write-Host "  v$npmVersion" -ForegroundColor Gray
} catch {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "  npm n'est pas installé!" -ForegroundColor Red
    $allGood = $false
}

# Vérifier MongoDB
Write-Host "Vérification MongoDB..." -NoNewline
try {
    $mongoVersion = mongod --version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host " ✓" -ForegroundColor Green
    Write-Host "  $mongoVersion" -ForegroundColor Gray
} catch {
    Write-Host " ⚠" -ForegroundColor Yellow
    Write-Host "  MongoDB n'est pas installé ou pas dans PATH" -ForegroundColor Yellow
    Write-Host "  Télécharger: https://www.mongodb.com/try/download/community" -ForegroundColor Gray
}

# Vérifier MongoDB en cours d'exécution
Write-Host "Vérification processus MongoDB..." -NoNewline
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host " ✓" -ForegroundColor Green
    Write-Host "  MongoDB est actif" -ForegroundColor Gray
} else {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "  MongoDB n'est pas démarré!" -ForegroundColor Red
    Write-Host "  Démarrer avec: mongod --dbpath=C:\data\db" -ForegroundColor Yellow
}

Write-Host ""

# Vérifier les fichiers de configuration
Write-Host "Vérification des fichiers..." -NoNewline
$configFiles = @(
    "backend\.env",
    "frontend\.env",
    "backend\requirements.txt",
    "frontend\package.json"
)

$missingFiles = @()
foreach ($file in $configFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Host " ✓" -ForegroundColor Green
    Write-Host "  Tous les fichiers nécessaires sont présents" -ForegroundColor Gray
} else {
    Write-Host " ⚠" -ForegroundColor Yellow
    Write-Host "  Fichiers manquants:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "    - $file" -ForegroundColor Gray
    }
}

Write-Host ""

# Vérifier environnement virtuel Python
Write-Host "Vérification venv Python..." -NoNewline
if (Test-Path "backend\venv") {
    Write-Host " ✓" -ForegroundColor Green
    Write-Host "  Environnement virtuel existe" -ForegroundColor Gray
} else {
    Write-Host " ⚠" -ForegroundColor Yellow
    Write-Host "  Environnement virtuel non créé" -ForegroundColor Yellow
    Write-Host "  Créer avec: cd backend && python -m venv venv" -ForegroundColor Gray
}

# Vérifier node_modules
Write-Host "Vérification node_modules..." -NoNewline
if (Test-Path "frontend\node_modules") {
    Write-Host " ✓" -ForegroundColor Green
    Write-Host "  Dépendances npm installées" -ForegroundColor Gray
} else {
    Write-Host " ⚠" -ForegroundColor Yellow
    Write-Host "  Dépendances npm non installées" -ForegroundColor Yellow
    Write-Host "  Installer avec: cd frontend && npm install" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "  Environnement prêt! ✓" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Démarrer MongoDB (si pas actif)" -ForegroundColor White
    Write-Host "  2. Lancer: .\start-local.ps1" -ForegroundColor White
} else {
    Write-Host "  Configuration incomplète!" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Installer les outils manquants, puis relancer ce script." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - QUICKSTART.md - Démarrage rapide" -ForegroundColor Gray
Write-Host "  - SETUP_LOCAL.md - Setup complet" -ForegroundColor Gray
Write-Host ""
