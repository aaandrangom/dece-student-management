#!/bin/bash

echo "==== Generador de Contraseñas Seguras - SIGDECE ===="
echo "====================================================="
echo ""

PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)

echo "[OK] Contraseña generada:"
echo ""
echo "   $PASSWORD"
echo ""
echo "[INFO] Para usar esta contraseña:"
echo "   1. Copia la contraseña de arriba"
echo "   2. Abre el archivo .env en la raíz del proyecto"
echo "   3. Reemplaza el valor de ADMIN_PASSWORD con la nueva contraseña"
echo "   4. Guarda el archivo"
echo ""
echo "[IMPORTANTE] Guarda esta contraseña en un lugar seguro!"
echo ""

if command -v xclip &> /dev/null; then
    echo "$PASSWORD" | xclip -selection clipboard
    echo "[OK] La contraseña también se copió al portapapeles"
elif command -v pbcopy &> /dev/null; then
    echo "$PASSWORD" | pbcopy
    echo "[OK] La contraseña también se copió al portapapeles"
else
    echo "[INFO] No se pudo copiar al portapapeles automáticamente"
fi