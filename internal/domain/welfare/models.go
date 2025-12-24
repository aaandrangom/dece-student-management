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
	PorcentajeDiscapacidad    int
	TipoDiscapacidad          string
	DetallesDiscapacidad      string
	EvaluacionPsicopedagogica bool
	ArchivoEvaluacionPath     string
	Alergias                  string
	Cirugias                  string
	Enfermedades              string

	// Genero / Maternidad / Paternidad
	SituacionGenero string // 'EMBARAZO', 'LACTANCIA', 'PATERNIDAD', 'NINGUNO'
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
	Tipo              string // 'DISCIPLINA' o 'VIOLENCIA'
	Subtipo           string // 'SEXUAL', 'INTRAFAMILIAR', 'NEGLIGENCIA', 'ACOSO'
	DescripcionMotivo string
	Gravedad          string // 'LEVE', 'GRAVE', 'MUY_GRAVE'

	// Gestión
	AccionesRealizadas string
	Resolucion         string // Medida tomada
	DerivadoA          string // 'Fiscalia', 'Distrito'
	FechaDerivacion    *time.Time
	ArchivoAdjuntoPath string // Evidencia general / Informe Derivación
	ArchivoActaPath    string // Acta de compromiso firmada
	Estado             string // 'ABIERTO', 'CERRADO', 'EN_SEGUIMIENTO'

	// Representantes
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
	Estado             string // 'PENDIENTE', 'REALIZADA', 'CANCELADA'

	Historial student.HistorialAcademico `gorm:"foreignKey:HistorialID"`
}
