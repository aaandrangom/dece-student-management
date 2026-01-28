package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// VARIABLES GLOBALES PARA INYECCIÓN (LDFLAGS)
var InjectedTelegramKey string
var InjectedTelegramAPIURL string // <--- NUEVO: Para inyectar la URL
var InjectedAppEnv string         // <--- NUEVO: Para inyectar "production"

type Config struct {
	AdminUsername  string
	AdminPassword  string
	AdminFullName  string
	DBPath         string
	AppEnv         string
	TelegramAPIURL string
	TelegramAPIKey string
}

var AppConfig *Config

func LoadConfig() error {
	// Intentamos cargar .env (Solo servirá en wails dev)
	if err := godotenv.Load(); err != nil {
		log.Println("ℹ️  Modo Producción o .env no encontrado. Usando variables inyectadas.")
	} else {
		log.Println("✅ Modo Desarrollo: .env cargado.")
	}

	AppConfig = &Config{
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "ChangeMe123!"),
		AdminFullName: getEnv("ADMIN_FULL_NAME", "Administrador del Sistema"),
		DBPath:        getEnv("DB_PATH", "./sigdece.db"),

		// AHORA AMBOS SON INYECTABLES:
		// Si compilamos para producción, tomarán los valores del comando de build.
		// Si estamos en dev, tomarán los del archivo .env.
		AppEnv:         getSecureVal(InjectedAppEnv, "APP_ENV"),
		TelegramAPIURL: getSecureVal(InjectedTelegramAPIURL, "TELEGRAM_API_URL"),
		TelegramAPIKey: getSecureVal(InjectedTelegramKey, "TELEGRAM_API_KEY"),
	}

	return nil
}

// (Tus funciones auxiliares siguen igual)
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getSecureVal(injectedValue, envKey string) string {
	if injectedValue != "" {
		return injectedValue
	}
	// Si no hay inyección, usamos el valor del .env o un default seguro
	val := os.Getenv(envKey)
	if val == "" && envKey == "APP_ENV" {
		return "development" // Default para AppEnv si todo falla
	}
	return val
}
