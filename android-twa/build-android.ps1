# Compila la app Android Oso Sound (TWA) para Google Play
# Ejecutar desde PowerShell en la carpeta android-twa

$ErrorActionPreference = "Stop"

Write-Host "=== Oso Sound - Build Android TWA ===" -ForegroundColor Cyan

if (-not (Get-Command bubblewrap -ErrorAction SilentlyContinue)) {
  Write-Host "Instalando Bubblewrap..." -ForegroundColor Yellow
  npm install -g @bubblewrap/cli
}

if (-not (Test-Path "android.keystore")) {
  Write-Host ""
  Write-Host "No existe android.keystore. Creá uno con:" -ForegroundColor Yellow
  Write-Host 'keytool -genkeypair -v -keystore android.keystore -alias ososound -keyalg RSA -keysize 2048 -validity 10000'
  exit 1
}

$password = Read-Host "Contraseña del keystore (android.keystore)" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = $plain
$env:BUBBLEWRAP_KEY_PASSWORD = $plain

Write-Host "Generando proyecto Android..." -ForegroundColor Green
bubblewrap update

Write-Host "Compilando AAB..." -ForegroundColor Green
bubblewrap build

Write-Host ""
Write-Host "Listo. Buscá el archivo .aab en esta carpeta y subilo a Play Console." -ForegroundColor Green
Write-Host "Ver README.md para los pasos de publicacion." -ForegroundColor Cyan
