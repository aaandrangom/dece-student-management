package enrollment

import (
	domain "dece/internal/domain/enrollment"
)

type HistorialMatriculaDTO struct {
	ID             uint   `json:"id"`
	PeriodoLectivo string `json:"periodo_lectivo"`
	CursoNombre    string `json:"curso_nombre"`
	Estado         string `json:"estado"`
	Fecha          string `json:"fecha"`
}

type GuardarMatriculaDTO struct {
	ID           uint `json:"id"`
	EstudianteID uint `json:"estudiante_id" validate:"required"`
	CursoID      uint `json:"curso_id" validate:"required"`
	EsRepetidor  bool `json:"es_repetidor"`

	Antropometria      domain.Antropometria      `json:"antropometria"`
	HistorialAcademico domain.HistorialAcademico `json:"historial_academico"`
	DatosSalud         domain.DatosSalud         `json:"datos_salud"`
	DatosSociales      domain.DatosSociales      `json:"datos_sociales"`
	CondicionGenero    domain.CondicionGenero    `json:"condicion_genero"`

	DireccionActual    string `json:"direccion_actual"`
	RutaCroquis        string `json:"ruta_croquis"`
	RutaConsentimiento string `json:"ruta_consentimiento"`
	Estado             string `json:"estado"`
}

type MatriculaResponseDTO struct {
	GuardarMatriculaDTO
}
