package reports

type ReporteEstadisticoDTO struct {
	ConteoTipoCaso        []EstadisticaTipoCasoDTO         `json:"conteo_tipo_caso"`
	TopCursosConflictivos []EstadisticaCursoConflictivoDTO `json:"top_cursos_conflictivos"`
	DerivacionesExternas  []EstadisticaDerivacionDTO       `json:"derivaciones_externas"`
	FechaInicio           string                           `json:"fecha_inicio"`
	FechaFin              string                           `json:"fecha_fin"`
}

type EstadisticaTipoCasoDTO struct {
	TipoCaso string `json:"tipo_caso"`
	Cantidad int    `json:"cantidad"`
}

type EstadisticaCursoConflictivoDTO struct {
	Curso       string `json:"curso"`
	TotalFaltas int    `json:"total_faltas"`
}

type EstadisticaDerivacionDTO struct {
	EntidadDerivacion string `json:"entidad_derivacion"`
	Cantidad          int    `json:"cantidad"`
}
