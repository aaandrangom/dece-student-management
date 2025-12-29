package academic

type CrearPeriodoDTO struct {
	Nombre      string `json:"nombre" validate:"required"`
	FechaInicio string `json:"fecha_inicio" validate:"required"`
	FechaFin    string `json:"fecha_fin" validate:"required"`
}

type PeriodoResponseDTO struct {
	ID          uint   `json:"id"`
	Nombre      string `json:"nombre"`
	FechaInicio string `json:"fecha_inicio"`
	FechaFin    string `json:"fecha_fin"`
	EsActivo    bool   `json:"es_activo"`
	Cerrado     bool   `json:"cerrado"`
	Estado      string `json:"estado"`
}

type ActualizarPeriodoDTO struct {
	ID          uint   `json:"id" validate:"required"`
	Nombre      string `json:"nombre" validate:"required"`
	FechaInicio string `json:"fecha_inicio" validate:"required"`
	FechaFin    string `json:"fecha_fin" validate:"required"`
}
