package database

import (
	"fmt"
	"os"
	"path/filepath"

	"dece/internal/domain/academic"
	"dece/internal/domain/enrollment"
	"dece/internal/domain/faculty"
	"dece/internal/domain/management"
	"dece/internal/domain/notifications"
	"dece/internal/domain/security"
	"dece/internal/domain/student"
	"dece/internal/domain/tracking"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	var err error

	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = "."
	}

	appPath := filepath.Join(configDir, "SigDECE")

	err = os.MkdirAll(appPath, 0755)
	if err != nil {
		panic("Error al crear directorio de base de datos: " + err.Error())
	}

	dbFile := filepath.Join(appPath, "sigdece.db")

	fmt.Println("📂 Base de datos ubicada en:", dbFile)

	DB, err = gorm.Open(sqlite.Open(dbFile), &gorm.Config{})
	if err != nil {
		panic("Error al conectar base de datos: " + err.Error())
	}

	DB.Exec("PRAGMA foreign_keys = ON")

	err = DB.AutoMigrate(
		&security.Usuario{},
		&security.ConfiguracionInstitucional{},
		&academic.PeriodoLectivo{},
		&academic.NivelEducativo{},
		&academic.Materia{},
		&faculty.Docente{},
		&student.Estudiante{},
		&student.Familiar{},
		&faculty.Curso{},
		&faculty.DistributivoMateria{},
		&enrollment.Matricula{},
		&enrollment.RetiroEstudiante{},
		&tracking.LlamadoAtencion{},
		&tracking.CasoSensible{},
		&management.Convocatoria{},
		&management.Capacitacion{},
		&notifications.Notificacion{},
	)

	if err != nil {
		panic("Error en migración de base de datos: " + err.Error())
	}

	return DB
}
