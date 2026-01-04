Write-Host "🔐 Generador de Contraseñas Seguras - SIGDECE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

function Generate-SecurePassword {
    $uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    $lowercase = "abcdefghijklmnopqrstuvwxyz"
    $numbers = "0123456789"
    $symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?"
    
    $allChars = $uppercase + $lowercase + $numbers + $symbols
    
    $password = @(
        $uppercase[(Get-Random -Maximum $uppercase.Length)]
        $lowercase[(Get-Random -Maximum $lowercase.Length)]
        $numbers[(Get-Random -Maximum $numbers.Length)]
        $symbols[(Get-Random -Maximum $symbols.Length)]
    )
    
    for ($i = 0; $i -lt 20; $i++) {
        $password += $allChars[(Get-Random -Maximum $allChars.Length)]
    }
    
    return -join ($password | Get-Random -Count $password.Length)
}

$password = Generate-SecurePassword

Write-Host "✅ Contraseña generada:" -ForegroundColor Green
Write-Host ""
Write-Host "   $password" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Para usar esta contraseña:" -ForegroundColor White
Write-Host "   1. Copia la contraseña de arriba (selecciona y Ctrl+C)"
Write-Host "   2. Abre el archivo .env en la raíz del proyecto"
Write-Host "   3. Reemplaza el valor de ADMIN_PASSWORD con la nueva contraseña"
Write-Host "   4. Guarda el archivo"
Write-Host ""
Write-Host "⚠️  Guarda esta contraseña en un lugar seguro!" -ForegroundColor Red
Write-Host ""

try {
    Set-Clipboard -Value $password
    Write-Host "✅ La contraseña también se copió al portapapeles" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No se pudo copiar al portapapeles automáticamente" -ForegroundColor Yellow
}