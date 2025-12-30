package faculty

type CursoResponseDTO struct {
	ID             uint   `json:"id"`
	NivelNombre    string `json:"nivel_nombre"`
	Paralelo       string `json:"paralelo"`
	Jornada        string `json:"jornada"`
	TutorNombre    string `json:"tutor_nombre"`
	NombreCompleto string `json:"nombre_completo"`

	NivelID uint  `json:"nivel_id"`
	TutorID *uint `json:"tutor_id"`
}

type GuardarCursoDTO struct {
	ID        uint   `json:"id"`
	PeriodoID uint   `json:"periodo_id" validate:"required"`
	NivelID   uint   `json:"nivel_id" validate:"required"`
	Paralelo  string `json:"paralelo" validate:"required"`
	Jornada   string `json:"jornada" validate:"required"`
	TutorID   *uint  `json:"tutor_id"`
}
