package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AdminUsername string
	AdminPassword string
	AdminFullName string
	DBPath        string
	AppEnv        string
}

var AppConfig *Config

func LoadConfig() error {
	if err := godotenv.Load(); err != nil {
		log.Println("Advertencia: archivo .env no encontrado, usando variables de entorno del sistema")
	}

	AppConfig = &Config{
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "ChangeMe123!"),
		AdminFullName: getEnv("ADMIN_FULL_NAME", "Administrador del Sistema"),
		DBPath:        getEnv("DB_PATH", "./sigdece.db"),
		AppEnv:        getEnv("APP_ENV", "development"),
	}

	if AppConfig.AppEnv == "production" && AppConfig.AdminPassword == "ChangeMe123!" {
		log.Println("⚠️  ADVERTENCIA DE SEGURIDAD: Usando contraseña por defecto en producción")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
