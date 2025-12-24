package student

import (
	"dece/internal/domain/academic"
	"time"
)

type Estudiante struct {
	ID              uint   `gorm:"primaryKey"`
	Cedula          string `gorm:"unique;not null"`
	Apellidos       string `gorm:"not null"`
	Nombres         string `gorm:"not null"`
	FechaNacimiento time.Time
	Genero          string // 'M' o 'F'
	Nacionalidad    string
	FotoPerfilPath  string
	FechaRegistro   time.Time `gorm:"autoCreateTime"`
}

type HistorialAcademico struct {
	ID           uint `gorm:"primaryKey"`
	EstudianteID uint `gorm:"not null;uniqueIndex:idx_historial_estudiante_aula"`
	AulaID       uint `gorm:"not null;uniqueIndex:idx_historial_estudiante_aula"`

	// Ubicación y Contacto del Año
	DireccionDomicilio string
	CroquisPath        string
	TelefonoContacto   string

	// Datos de Ingreso
	EsNuevo                bool
	InstitucionProcedencia string
	HaRepetido             bool

	// Salud Física del Año
	Peso          float64
	Talla         float64
	EdadCalculada int
	TipoSangre    string

	// Estado de la Matrícula
	Estado       string `gorm:"default:'MATRICULADO'"` // MATRICULADO, RETIRADO
	FechaRetiro  *time.Time
	MotivoRetiro string

	Estudiante Estudiante    `gorm:"foreignKey:EstudianteID"`
	Aula       academic.Aula `gorm:"foreignKey:AulaID"`
}

type Familiar struct {
	ID                   uint `gorm:"primaryKey"`
	EstudianteID         uint
	Rol                  string // 'PADRE', 'MADRE', 'REPRESENTANTE'
	Cedula               string
	NombresCompletos     string
	Telefono             string
	Profesion            string
	LugarTrabajo         string
	NivelInstruccion     string
	EsRepresentanteLegal bool
	DocumentoLegalPath   string
	Fallecido            bool `gorm:"default:false"`

	Estudiante Estudiante `gorm:"foreignKey:EstudianteID"`
}

type ConvivienteHogar struct {
	ID               uint `gorm:"primaryKey"`
	HistorialID      uint
	NombresCompletos string
	Parentesco       string
	Edad             int

	Historial HistorialAcademico `gorm:"foreignKey:HistorialID"`
}
