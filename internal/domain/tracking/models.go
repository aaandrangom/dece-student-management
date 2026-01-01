package tracking

import (
	"dece/internal/domain/academic"
	"dece/internal/domain/common"
	"dece/internal/domain/enrollment"
	"dece/internal/domain/student"
)

type DetalleSancion struct {
	MedidaDisciplinaria  string `json:"medida_disciplinaria"`
	RutaResolucion       string `json:"ruta_resolucion"`
	CumplioMedida        bool   `json:"cumplio_medida"`
	MotivoIncumplimiento string `json:"motivo_incumplimiento"`
}

type LlamadoAtencion struct {
	ID          uint `gorm:"primaryKey" json:"id"`
	MatriculaID uint `json:"matricula_id"`

	Fecha  string `json:"fecha"`
	Motivo string `json:"motivo"`

	RepresentanteNotificado bool   `json:"representante_notificado"`
	RepresentanteFirmo      bool   `json:"representante_firmo"`
	RutaActa                string `json:"ruta_acta"`
	MotivoNoFirma           string `json:"motivo_no_firma"`

	DetalleSancion common.JSONMap[DetalleSancion] `gorm:"type:text" json:"detalle_sancion"`

	Matricula enrollment.Matricula `gorm:"foreignKey:MatriculaID" json:"matricula,omitempty"`
}

type CasoSensible struct {
	ID           uint `gorm:"primaryKey" json:"id"`
	EstudianteID uint `json:"estudiante_id"`
	PeriodoID    uint `json:"periodo_id"`

	CodigoCaso        string `json:"codigo_caso"`
	FechaDeteccion    string `json:"fecha_deteccion"`
	EntidadDerivacion string `json:"entidad_derivacion"`
	Descripcion       string `json:"descripcion"`
	Estado            string `json:"estado"`

	RutasDocumentos common.JSONMap[[]string] `gorm:"type:text" json:"rutas_documentos"`

	Estudiante student.Estudiante      `gorm:"foreignKey:EstudianteID" json:"estudiante"`
	Periodo    academic.PeriodoLectivo `gorm:"foreignKey:PeriodoID" json:"periodo"`
}
