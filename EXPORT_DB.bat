@echo off
REM Script d'export rapide de la base de données
echo.
echo ========================================
echo   EXPORT RAPIDE DE LA BASE DE DONNEES
echo ========================================
echo.

cd /d "%~dp0backend"

python export_db.py

echo.
echo Appuyez sur une touche pour fermer...
pause >nul
