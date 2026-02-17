package management

import (
	"dece/internal/domain/academic"
	"dece/internal/domain/common"
	"dece/internal/domain/enrollment"
)

type Convocatoria struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	MatriculaID uint   `json:"matricula_id"`
	Entidad     string `json:"entidad"`

	Motivo string `json:"motivo"`

	FechaCita      string `json:"fecha_cita"`
	DiasAlerta     int    `json:"dias_alerta"`
	CitaCompletada bool   `json:"cita_completada"`
	TelegramSynced bool   `json:"telegram_synced" gorm:"default:false"`
	TelegramID     int    `json:"telegram_id" gorm:"default:0"`

	Matricula enrollment.Matricula `gorm:"foreignKey:MatriculaID" json:"matricula"`
}

// SyncPendiente representa una operación pendiente de sincronización con Telegram.
// Se usa como cola offline cuando no hay conexión a internet.
type SyncPendiente struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	Operacion  string `json:"operacion"`   // "create", "update", "delete"
	CitaID     uint   `json:"cita_id"`     // ID local de la convocatoria
	TelegramID int    `json:"telegram_id"` // ID remoto en la API de Telegram (para update/delete)
	Payload    string `json:"payload"`     // JSON serializado del payload
	Intentos   int    `json:"intentos" gorm:"default:0"`
	CreadoEn   string `json:"creado_en"`
}

type AudienciaCapacitacion struct {
	GrupoObjetivo         string `json:"grupo_objetivo"`
	JornadaDocentes       string `json:"jornada_docentes"`
	CursoID               uint   `json:"curso_id"`
	CursosIDs             []uint `json:"cursos_ids"`
	GradoEspecifico       string `json:"grado_especifico"`
	ParaleloEspecifico    string `json:"paralelo_especifico"`
	CantidadBeneficiarios int    `json:"cantidad_beneficiarios"`
}

type Capacitacion struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	PeriodoID uint   `json:"periodo_id"`
	Tema      string `json:"tema"`
	Fecha     string `json:"fecha"`

	DetalleAudiencia common.JSONMap[AudienciaCapacitacion] `gorm:"type:text" json:"detalle_audiencia"`
	RutaEvidencia    string                                `json:"ruta_evidencia"`
	Periodo          academic.PeriodoLectivo               `gorm:"foreignKey:PeriodoID" json:"periodo"`
}
