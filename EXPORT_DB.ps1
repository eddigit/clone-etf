# Script PowerShell d'export rapide de la base de données
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  EXPORT RAPIDE DE LA BASE DE DONNEES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\backend"

python export_db.py

Write-Host "`nAppuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
