package database

import (
	"dece/internal/config"
	"dece/internal/domain/academic"
	"dece/internal/domain/common"
	"dece/internal/domain/security"
	"errors"
	"fmt"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedAll(db *gorm.DB) error {
	if db == nil {
		return errors.New("Base de datos no inicializada")
	}

	if err := seedAdminUser(db); err != nil {
		return fmt.Errorf("Error seeding admin: %w", err)
	}

	if err := seedNivelesEducativos(db); err != nil {
		return fmt.Errorf("Error seeding niveles: %w", err)
	}

	if err := seedMaterias(db); err != nil {
		return fmt.Errorf("Error seeding materias: %w", err)
	}

	if err := seedConfiguracion(db); err != nil {
		return fmt.Errorf("Error seeding config: %w", err)
	}

	log.Println("Base de datos poblada exitosamente (Seeding completado)")
	return nil
}

func seedAdminUser(db *gorm.DB) error {
	usuario := config.AppConfig.AdminUsername
	passRaw := config.AppConfig.AdminPassword
	nombreCompleto := config.AppConfig.AdminFullName

	var count int64
	db.Model(&security.Usuario{}).Where("nombre_usuario = ?", usuario).Count(&count)
	if count > 0 {
		return nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(passRaw), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	admin := security.Usuario{
		NombreUsuario:  usuario,
		ClaveHash:      string(hashedPassword),
		NombreCompleto: nombreCompleto,
		Rol:            "admin",
		Activo:         true,
		FechaCreacion:  time.Now().Format("2006-01-02 15:04:05"),
	}

	log.Printf("Creando usuario administrador: %s", usuario)
	return db.Create(&admin).Error
}

func seedNivelesEducativos(db *gorm.DB) error {
	niveles := []academic.NivelEducativo{
		{Nombre: "1ro EGB", NombreCompleto: "Primero de Educación General Básica", Orden: 1},
		{Nombre: "2do EGB", NombreCompleto: "Segundo de Educación General Básica", Orden: 2},
		{Nombre: "3ro EGB", NombreCompleto: "Tercero de Educación General Básica", Orden: 3},
		{Nombre: "4to EGB", NombreCompleto: "Cuarto de Educación General Básica", Orden: 4},
		{Nombre: "5to EGB", NombreCompleto: "Quinto de Educación General Básica", Orden: 5},
		{Nombre: "6to EGB", NombreCompleto: "Sexto de Educación General Básica", Orden: 6},
		{Nombre: "7mo EGB", NombreCompleto: "Séptimo de Educación General Básica", Orden: 7},
		{Nombre: "8vo EGB", NombreCompleto: "Octavo de Educación General Básica", Orden: 8},
		{Nombre: "9no EGB", NombreCompleto: "Noveno de Educación General Básica", Orden: 9},
		{Nombre: "10mo EGB", NombreCompleto: "Décimo de Educación General Básica", Orden: 10},
	}

	for _, nivel := range niveles {
		if err := db.Where(academic.NivelEducativo{Nombre: nivel.Nombre}).FirstOrCreate(&nivel).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedMaterias(db *gorm.DB) error {
	materias := []academic.Materia{
		{Nombre: "Matemáticas", Area: "Ciencias Exactas"},
		{Nombre: "Lengua y Literatura", Area: "Lenguaje"},
		{Nombre: "Ciencias Naturales", Area: "Ciencias"},
		{Nombre: "Estudios Sociales", Area: "Sociales"},
		{Nombre: "Inglés", Area: "Idiomas"},
		{Nombre: "Educación Física", Area: "Cultura Física"},
		{Nombre: "Educación Cultural y Artística", Area: "ECA"},
		{Nombre: "Física", Area: "Ciencias Exactas"},
		{Nombre: "Química", Area: "Ciencias Exactas"},
		{Nombre: "Biología", Area: "Ciencias"},
		{Nombre: "Historia", Area: "Sociales"},
		{Nombre: "Filosofía", Area: "Sociales"},
	}

	for _, materia := range materias {
		if err := db.Where(academic.Materia{Nombre: materia.Nombre}).FirstOrCreate(&materia).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedConfiguracion(db *gorm.DB) error {
	var count int64
	db.Model(&security.ConfiguracionInstitucional{}).Count(&count)

	if count == 0 {
		config := security.ConfiguracionInstitucional{
			Nombre:     "Escuela De Educación Básica 3 De Julio",
			CodigoAMIE: "00H00000",
			Distrito:   "01",
			Circuito:   "01",

			DetalleUbicacion: common.JSONMap[security.DetalleUbicacion]{
				Data: security.DetalleUbicacion{
					Provincia:     "Esmeraldas",
					Canton:        "Quinindé",
					Parroquia:     "Rosa Zárate",
					BarrioRecinto: "Barrio Central",
				},
			},
		}
		return db.Create(&config).Error
	}
	return nil
}
