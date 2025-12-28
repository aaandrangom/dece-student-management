package database

import (
	"dece/internal/domain/academic"
	"dece/internal/domain/enrollment"
	"dece/internal/domain/faculty"
	"dece/internal/domain/management"
	"dece/internal/domain/security"
	"dece/internal/domain/student"
	"dece/internal/domain/tracking"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	var err error

	DB, err = gorm.Open(sqlite.Open("dece.db"), &gorm.Config{})
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

		&tracking.LlamadoAtencion{},
		&tracking.CasoSensible{},
		&management.Convocatoria{},
		&management.Capacitacion{},
	)

	if err != nil {
		panic("Error en migración de base de datos: " + err.Error())
	}

	return DB
}
