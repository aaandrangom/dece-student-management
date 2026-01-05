package tracking

type CasoResumenDTO struct {
	ID                uint     `json:"id"`
	CodigoCaso        string   `json:"codigo_caso"`
	FechaDeteccion    string   `json:"fecha_deteccion"`
	EntidadDerivacion string   `json:"entidad_derivacion"`
	Descripcion       string   `json:"descripcion"`
	Estado            string   `json:"estado"`
	TotalEvidencias   int      `json:"total_evidencias"`
	RutasEvidencias   []string `json:"rutas_evidencias"`
}

type GuardarCasoDTO struct {
	ID                uint   `json:"id"`
	EstudianteID      uint   `json:"estudiante_id" validate:"required"`
	FechaDeteccion    string `json:"fecha_deteccion" validate:"required"`
	EntidadDerivacion string `json:"entidad_derivacion"`
	Descripcion       string `json:"descripcion" validate:"required"`
	Estado            string `json:"estado"`
}
