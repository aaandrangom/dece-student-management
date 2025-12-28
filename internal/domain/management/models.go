package management

import (
	"dece/internal/domain/academic"
	"dece/internal/domain/common"
	"dece/internal/domain/enrollment"
	"time"
)

type Convocatoria struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	MatriculaID    uint      `json:"matricula_id"`
	Entidad        string    `json:"entidad"`
	FechaCita      time.Time `json:"fecha_cita"`
	DiasAlerta     int       `json:"dias_alerta"`
	CitaCompletada bool      `json:"cita_completada"`

	Matricula enrollment.Matricula `gorm:"foreignKey:MatriculaID" json:"matricula"`
}

type AudienciaCapacitacion struct {
	GrupoObjetivo string `json:"grupo_objetivo"`
	Grado         string `json:"grado,omitempty"`
	Asistentes    int    `json:"asistentes,omitempty"`
}

type Capacitacion struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	PeriodoID uint      `json:"periodo_id"`
	Tema      string    `json:"tema"`
	Fecha     time.Time `json:"fecha"`

	DetalleAudiencia common.JSONMap[AudienciaCapacitacion] `gorm:"type:text" json:"detalle_audiencia"`
	RutaEvidencia    string                                `json:"ruta_evidencia"`

	Periodo academic.PeriodoLectivo `gorm:"foreignKey:PeriodoID" json:"periodo"`
}
