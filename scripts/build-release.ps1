<#
.SYNOPSIS
    Compila SIGDECE para producción y prepara la publicación de una versión nueva.

.DESCRIPTION
    1. Lee las credenciales de producción de .env.production (no se sube a git).
    2. Verifica que la versión de updater.go y wails.json coincidan y que tenga notas
       en frontend\src\changelog.json.
    3. Compila con "wails build" inyectando APP_ENV=production y las claves de Telegram
       dentro del ejecutable (-ldflags -X). La inyección se hace en CADA compilación:
       un ejecutable compilado sin este script no lleva las claves.
    4. Genera build\bin\version.json con la versión, el enlace de descarga y las notas,
       listo para subir a R2 junto con build\bin\SIGDECE.exe.

.EXAMPLE
    .\scripts\build-release.ps1
#>
param(
    [string]$DownloadUrl = "https://pub-5f8dc7e2cbc145af89c5cfe85612a8c7.r2.dev/SIGDECE.exe",
    # Solo revisa credenciales, versión y notas, sin compilar.
    [switch]$SoloVerificar
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Paso($texto) { Write-Host "`n==> $texto" -ForegroundColor Cyan }

# ---------------------------------------------------------------- 1. Credenciales
Paso "Leyendo credenciales de producción"
$envFile = Join-Path $root '.env.production'
if (-not (Test-Path $envFile)) {
    throw "Falta .env.production. Copie .env.production.example como .env.production y complete los valores de Telegram de producción."
}
$vars = @{}
foreach ($linea in Get-Content $envFile -Encoding UTF8) {
    $l = $linea.Trim()
    if ($l -and -not $l.StartsWith('#') -and $l.Contains('=')) {
        $partes = $l.Split('=', 2)
        $vars[$partes[0].Trim()] = $partes[1].Trim().Trim('"')
    }
}
foreach ($clave in 'TELEGRAM_API_URL', 'TELEGRAM_API_KEY') {
    if (-not $vars[$clave]) { throw "Falta $clave en .env.production" }
}
Write-Host "    TELEGRAM_API_URL = $($vars.TELEGRAM_API_URL)"
Write-Host "    TELEGRAM_API_KEY = ****$($vars.TELEGRAM_API_KEY.Substring([Math]::Max(0, $vars.TELEGRAM_API_KEY.Length - 4)))"

# ---------------------------------------------------------------- 2. Versión y notas
Paso "Verificando versión y notas"
$goVersion = [regex]::Match((Get-Content updater.go -Raw), 'CurrentVersion\s*=\s*"([^"]+)"').Groups[1].Value
$wailsVersion = (Get-Content wails.json -Raw | ConvertFrom-Json).info.productVersion
if (-not $goVersion -or $goVersion -ne $wailsVersion) {
    throw "Las versiones no coinciden: updater.go=$goVersion, wails.json=$wailsVersion"
}
$changelog = Get-Content (Join-Path $root 'frontend\src\changelog.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$entrada = $changelog | Where-Object { $_.version -eq $goVersion } | Select-Object -First 1
if (-not $entrada) {
    throw "No hay notas para la versión $goVersion en frontend\src\changelog.json. Agréguelas antes de publicar."
}
Write-Host "    Versión $goVersion ($($entrada.fecha)) - $(@($entrada.notas).Count) notas"
if ($SoloVerificar) { Write-Host "`nVerificación correcta (no se compiló)." -ForegroundColor Green; exit 0 }

# ---------------------------------------------------------------- 3. Compilación
Paso "Compilando con credenciales inyectadas"
$pkg = 'dece/internal/config'
$ldflags = "-X '$pkg.InjectedAppEnv=production' -X '$pkg.InjectedTelegramAPIURL=$($vars.TELEGRAM_API_URL)' -X '$pkg.InjectedTelegramKey=$($vars.TELEGRAM_API_KEY)'"
wails build -clean -ldflags $ldflags
if ($LASTEXITCODE -ne 0) { throw "wails build falló (código $LASTEXITCODE)" }

$exe = Join-Path $root 'build\bin\SIGDECE.exe'
if (-not (Test-Path $exe)) { throw "No se encontró $exe" }

# ---------------------------------------------------------------- 4. version.json
Paso "Generando version.json"
$info = [ordered]@{
    version      = $goVersion
    download_url = $DownloadUrl
    fecha        = $entrada.fecha
    resumen      = $entrada.resumen
    notas        = @($entrada.notas)
}
$json = $info | ConvertTo-Json -Depth 5
$versionJson = Join-Path $root 'build\bin\version.json'
[System.IO.File]::WriteAllText($versionJson, $json, (New-Object System.Text.UTF8Encoding $false))

$tam = '{0:N1} MB' -f ((Get-Item $exe).Length / 1MB)
Write-Host "`nListo. Versión $goVersion compilada." -ForegroundColor Green
Write-Host "Suba a R2 (en este orden):"
Write-Host "  1. $exe  ($tam)  -> SIGDECE.exe"
Write-Host "  2. $versionJson  -> version.json"
Write-Host "Los equipos instalados verán el aviso de actualización al abrir el sistema."
