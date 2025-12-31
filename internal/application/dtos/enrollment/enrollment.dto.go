package enrollment

import (
	domain "dece/internal/domain/enrollment"
)

// DTO para el Historial (Lista simple)
type HistorialMatriculaDTO struct {
	ID             uint   `json:"id"`
	PeriodoLectivo string `json:"periodo_lectivo"` // "2024-2025"
	CursoNombre    string `json:"curso_nombre"`    // "10mo A"
	Estado         string `json:"estado"`
	Fecha          string `json:"fecha"`
}

// DTO para Guardar/Editar (Payload Completo)
type GuardarMatriculaDTO struct {
	ID           uint `json:"id"` // 0 crear, >0 editar
	EstudianteID uint `json:"estudiante_id" validate:"required"`
	CursoID      uint `json:"curso_id" validate:"required"`
	EsRepetidor  bool `json:"es_repetidor"`

	// Datos Planos (El service los envolverá en JSONMap)
	Antropometria      domain.Antropometria      `json:"antropometria"`
	HistorialAcademico domain.HistorialAcademico `json:"historial_academico"`
	DatosSalud         domain.DatosSalud         `json:"datos_salud"`
	DatosSociales      domain.DatosSociales      `json:"datos_sociales"`
	CondicionGenero    domain.CondicionGenero    `json:"condicion_genero"`

	DireccionActual string `json:"direccion_actual"`
	RutaCroquis     string `json:"ruta_croquis"`
}

// DTO de Respuesta Completa (Para cargar el formulario)
// Es idéntico al de Guardar, pero podríamos agregar nombres del estudiante/curso si fuera necesario
type MatriculaResponseDTO struct {
	GuardarMatriculaDTO
	Estado string `json:"estado"`
}
