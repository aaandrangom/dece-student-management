package faculty

import (
	"dece/internal/domain/academic"
)

type Docente struct {
	ID               uint   `gorm:"primaryKey" json:"id"`
	Cedula           string `gorm:"unique" json:"cedula"`
	NombresCompletos string `gorm:"not null" json:"nombres_completos"`
	Telefono         string `json:"telefono"`
	Correo           string `json:"correo"`
	Activo           bool   `gorm:"default:true" json:"activo"`
}

type Curso struct {
	ID        uint `gorm:"primaryKey" json:"id"`
	PeriodoID uint `json:"periodo_id"`
	NivelID   uint `json:"nivel_id"`
	TutorID   uint `json:"tutor_id"`

	Paralelo string `json:"paralelo"`
	Jornada  string `json:"jornada"`

	Periodo academic.PeriodoLectivo `gorm:"foreignKey:PeriodoID" json:"periodo,omitempty"`
	Nivel   academic.NivelEducativo `gorm:"foreignKey:NivelID" json:"nivel,omitempty"`
	Tutor   Docente                 `gorm:"foreignKey:TutorID" json:"tutor,omitempty"`
}

type DistributivoMateria struct {
	ID        uint `gorm:"primaryKey" json:"id"`
	CursoID   uint `json:"curso_id"`
	MateriaID uint `json:"materia_id"`
	DocenteID uint `json:"docente_id"`

	Curso   Curso            `gorm:"foreignKey:CursoID" json:"curso,omitempty"`
	Materia academic.Materia `gorm:"foreignKey:MateriaID" json:"materia,omitempty"`
	Docente Docente          `gorm:"foreignKey:DocenteID" json:"docente,omitempty"`
}
