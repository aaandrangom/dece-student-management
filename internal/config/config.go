package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

var InjectedTelegramKey string
var InjectedTelegramAPIURL string
var InjectedAppEnv string

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
	if err := godotenv.Load(); err != nil {
		log.Println("Modo Producción o .env no encontrado. Usando variables inyectadas.")
	} else {
		log.Println("Modo Desarrollo: .env cargado.")
	}

	AppConfig = &Config{
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "ChangeMe123!"),
		AdminFullName: getEnv("ADMIN_FULL_NAME", "Administrador del Sistema"),
		DBPath:        getEnv("DB_PATH", "./sigdece.db"),

		AppEnv:         getSecureVal(InjectedAppEnv, "APP_ENV"),
		TelegramAPIURL: getSecureVal(InjectedTelegramAPIURL, "TELEGRAM_API_URL"),
		TelegramAPIKey: getSecureVal(InjectedTelegramKey, "TELEGRAM_API_KEY"),
	}

	return nil
}

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

	val := os.Getenv(envKey)
	if val == "" && envKey == "APP_ENV" {
		return "development"
	}
	return val
}
