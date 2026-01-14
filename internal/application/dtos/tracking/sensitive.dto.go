package tracking

type EvidenciaDTO struct {
	Nombre string `json:"nombre"`
	Ruta   string `json:"ruta"`
}

type CasoResumenDTO struct {
	ID                       uint           `json:"id"`
	CodigoCaso               string         `json:"codigo_caso"`
	TipoCaso                 string         `json:"tipo_caso"`
	FechaDeteccion           string         `json:"fecha_deteccion"`
	EntidadDerivacion        string         `json:"entidad_derivacion"`
	EntidadDerivacionDetalle string         `json:"entidad_derivacion_detalle"`
	Descripcion              string         `json:"descripcion"`
	Estado                   string         `json:"estado"`
	TotalEvidencias          int            `json:"total_evidencias"`
	RutasEvidencias          []EvidenciaDTO `json:"rutas_evidencias"`
}

type GuardarCasoDTO struct {
	ID                       uint   `json:"id"`
	EstudianteID             uint   `json:"estudiante_id" validate:"required"`
	TipoCaso                 string `json:"tipo_caso" validate:"required"`
	FechaDeteccion           string `json:"fecha_deteccion" validate:"required"`
	EntidadDerivacion        string `json:"entidad_derivacion"`
	EntidadDerivacionDetalle string `json:"entidad_derivacion_detalle"`
	Descripcion              string `json:"descripcion" validate:"required"`
	Estado                   string `json:"estado"`
}
