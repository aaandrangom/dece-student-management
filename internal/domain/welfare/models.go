package welfare

import (
	"dece/internal/domain/student"
	"time"
)

type SaludVulnerabilidad struct {
	ID          uint `gorm:"primaryKey"`
	HistorialID uint `gorm:"unique"`

	// Salud
	Discapacidad              bool
	DetallesDiscapacidad      string
	EvaluacionPsicopedagogica bool
	ArchivoEvaluacionPath     string
	Alergias                  string
	Enfermedades              string

	// Genero / Maternidad / Paternidad
	SituacionGenero string // 'EMBARAZO', 'LACTANCIA', 'PATERNIDAD', 'NINGUNO'
	MesesTiempo     int
	ControlesSalud  bool
	RiesgoEmbarazo  bool
	NombrePareja    string

	Historial student.HistorialAcademico `gorm:"foreignKey:HistorialID"`
}

type DisciplinaCaso struct {
	ID                uint `gorm:"primaryKey"`
	HistorialID       uint
	Fecha             time.Time
	Tipo              string // 'DISCIPLINA' o 'VIOLENCIA'
	DescripcionMotivo string

	// Gestión
	AccionesRealizadas string
	DerivadoA          string // 'Fiscalia', 'Distrito'
	ArchivoAdjuntoPath string
	Estado             string // 'ABIERTO', 'CERRADO'

	Historial student.HistorialAcademico `gorm:"foreignKey:HistorialID"`
}
