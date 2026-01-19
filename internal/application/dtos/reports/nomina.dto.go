package reports

type NominaVulnerabilidadDTO struct {
	Cedula         string `json:"cedula"`
	Estudiante     string `json:"estudiante"`
	Curso          string `json:"curso"`
	TipoCaso       string `json:"tipo_caso"`
	CodigoCaso     string `json:"codigo_caso"`
	Estado         string `json:"estado"`
	FechaDeteccion string `json:"fecha_deteccion"`
}
