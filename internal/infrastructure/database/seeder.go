package database

import (
	"dece/internal/domain/institution"
	"errors"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func SeedAdminUser() error {
	if DB == nil {
		return errors.New("base de datos no inicializada")
	}

	var adminRole institution.Rol
	result := DB.FirstOrCreate(&adminRole, institution.Rol{Nombre: "ADMIN"})
	if result.Error != nil {
		return result.Error
	}

	var count int64
	DB.Model(&institution.Usuario{}).Where("rol_id = ?", adminRole.ID).Count(&count)

	if count > 0 {
		return nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	adminUser := institution.Usuario{
		Username:         "admin",
		PasswordHash:     string(hashedPassword),
		NombresCompletos: "Administrador del Sistema",
		RolID:            adminRole.ID,
		Activo:           true,
	}

	if err := DB.Create(&adminUser).Error; err != nil {
		return err
	}

	log.Println("Usuario administrador creado por defecto: admin / admin123")
	return nil
}
