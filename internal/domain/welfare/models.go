package welfare

import (
	"dece/internal/domain/student"
	"time"
)

type SaludVulnerabilidad struct {
	ID          uint `gorm:"primaryKey"`
	HistorialID uint `gorm:"unique"`

	Discapacidad              bool
	PorcentajeDiscapacidad    int
	TipoDiscapacidad          string
	DetallesDiscapacidad      string
	EvaluacionPsicopedagogica bool
	ArchivoEvaluacionPath     string
	Alergias                  string
	Cirugias                  string
	Enfermedades              string

	SituacionGenero string
	MesesTiempo     int
	ControlesSalud  bool
	RiesgoEmbarazo  bool
	NombrePareja    string
	EdadPareja      int

	Historial student.HistorialAcademico `gorm:"foreignKey:HistorialID"`
}

type ConvivienteHogar struct {
	ID               uint `gorm:"primaryKey"`
	HistorialID      uint
	NombresCompletos string
	Parentesco       string
	Edad             int

	Historial student.HistorialAcademico `gorm:"foreignKey:HistorialID"`
}

type DisciplinaCaso struct {
	ID                uint `gorm:"primaryKey"`
	HistorialID       uint
	Fecha             time.Time
	Tipo              string
	Subtipo           string
	DescripcionMotivo string
	Gravedad          string

	AccionesRealizadas string
	Resolucion         string
	DerivadoA          string
	FechaDerivacion    *time.Time
	ArchivoAdjuntoPath string
	ArchivoActaPath    string
	Estado             string

	NotificoRepresentante bool
	FirmoActa             bool
	MotivoNoFirma         string
	CumplioMedida         bool

	Historial student.HistorialAcademico `gorm:"foreignKey:HistorialID"`
}

type Cita struct {
	ID                 uint `gorm:"primaryKey"`
	HistorialID        uint
	FechaCita          time.Time
	Motivo             string
	EntidadDestino     string
	NotificarDiasAntes int
	Visto              bool
	Estado             string

	Historial student.HistorialAcademico `gorm:"foreignKey:HistorialID"`
}
