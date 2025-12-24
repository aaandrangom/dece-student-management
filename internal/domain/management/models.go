package management

import (
	"dece/internal/domain/academic"
	"time"
)

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
