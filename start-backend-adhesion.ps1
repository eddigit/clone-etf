# Script de démarrage du backend avec le système d'adhésion

Write-Host "🚀 Démarrage du backend En Toute Franchise" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Activer l'environnement virtuel
Write-Host "📦 Activation de l'environnement virtuel..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Vérifier que reportlab est installé
Write-Host "🔍 Vérification des dépendances..." -ForegroundColor Yellow
$reportlab = pip list | Select-String "reportlab"
if ($reportlab) {
    Write-Host "✅ reportlab est installé" -ForegroundColor Green
} else {
    Write-Host "❌ reportlab n'est pas installé. Installation..." -ForegroundColor Red
    pip install reportlab
}

# Créer le dossier PDF si nécessaire
if (!(Test-Path "backend\pdf_memberships")) {
    Write-Host "📁 Création du dossier pdf_memberships..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "backend\pdf_memberships" -Force | Out-Null
}

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Démarrage du serveur sur http://localhost:8001" -ForegroundColor Cyan
Write-Host "📚 API Documentation: http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ Fonctionnalités disponibles:" -ForegroundColor Yellow
Write-Host "   • Système d'adhésion avec 4 types" -ForegroundColor White
Write-Host "   • Génération automatique de PDF" -ForegroundColor White
Write-Host "   • Intégration HelloAsso" -ForegroundColor White
Write-Host "   • Webhook de paiement" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor Red
Write-Host ""

# Démarrer le serveur
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
