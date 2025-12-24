package database

import (
	"dece/internal/domain/academic"
	"dece/internal/domain/institution"
	"dece/internal/domain/management"
	"dece/internal/domain/student"
	"dece/internal/domain/welfare"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("dece.db"), &gorm.Config{})
	if err != nil {
		panic("Error al conectar base de datos: " + err.Error())
	}

	DB.Exec("PRAGMA foreign_keys = ON")

	err = DB.AutoMigrate(
		&institution.Institucion{},
		&institution.Rol{},
		&institution.Usuario{},

		&academic.AnioLectivo{},
		&academic.Docente{},
		&academic.Materia{},
		&academic.Curso{},
		&academic.Paralelo{},
		&academic.Aula{},
		&academic.CargaHoraria{},

		&student.Estudiante{},
		&student.HistorialAcademico{},
		&student.Familiar{},
		&student.ConvivienteHogar{},

		&welfare.SaludVulnerabilidad{},
		&welfare.DisciplinaCaso{},
		&welfare.Cita{},

		&management.Capacitacion{},
	)

	if err != nil {
		panic("Error en migración de base de datos: " + err.Error())
	}
}
