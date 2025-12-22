package management

import (
	"dece/internal/domain/academic"
	"dece/internal/domain/student"
	"time"
)

type Cita struct {
	ID                 uint `gorm:"primaryKey"`
	HistorialID        uint
	FechaCita          time.Time
	EntidadDestino     string
	NotificarDiasAntes int
	Visto              bool `gorm:"default:false"`

	Historial student.HistorialAcademico `gorm:"foreignKey:HistorialID"`
}

type Capacitacion struct {
	ID                   uint `gorm:"primaryKey"`
	AnioLectivoID        uint
	Tema                 string
	Fecha                time.Time
	PublicoObjetivo      string // Docentes, Padres
	AsistentesCount      int
	ArchivoEvidenciaPath string

	AnioLectivo academic.AnioLectivo `gorm:"foreignKey:AnioLectivoID"`
}
