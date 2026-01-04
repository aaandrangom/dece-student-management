echo "🔐 Generador de Contraseñas Seguras - SIGDECE"
echo "=============================================="
echo ""

PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)

echo "✅ Contraseña generada:"
echo ""
echo "   $PASSWORD"
echo ""
echo "📋 Para usar esta contraseña:"
echo "   1. Copia la contraseña de arriba"
echo "   2. Abre el archivo .env"
echo "   3. Pega en ADMIN_PASSWORD=$PASSWORD"
echo ""
echo "⚠️  Guarda esta contraseña en un lugar seguro!"
