package management

type AgendarCitaDTO struct {
	MatriculaID uint   `json:"matricula_id" validate:"required"`
	Entidad     string `json:"entidad" validate:"required"`

	Motivo string `json:"motivo"`

	FechaCita  string `json:"fecha_cita" validate:"required"`
	DiasAlerta int    `json:"dias_alerta"`
}

type ActualizarCitaDTO struct {
	ID          uint   `json:"id" validate:"required"`
	MatriculaID uint   `json:"matricula_id" validate:"required"`
	Entidad     string `json:"entidad" validate:"required"`

	Motivo string `json:"motivo"`

	FechaCita  string `json:"fecha_cita" validate:"required"`
	DiasAlerta int    `json:"dias_alerta"`
}

type CitaDetalleDTO struct {
	ID             uint   `json:"id"`
	MatriculaID    uint   `json:"matricula_id"`
	Entidad        string `json:"entidad"`
	Motivo         string `json:"motivo"`
	FechaCita      string `json:"fecha_cita"`
	DiasAlerta     int    `json:"dias_alerta"`
	Completada     bool   `json:"completada"`
	Curso          string `json:"curso"`
	Nombres        string `json:"nombres"`
	Apellidos      string `json:"apellidos"`
	NombreCompleto string `json:"nombre_completo"`
}

type CitaResumenDTO struct {
	ID        uint   `json:"id"`
	FechaHora string `json:"fecha_hora"`
	Entidad   string `json:"entidad"`

	Motivo string `json:"motivo"`

	EstudianteNombre string `json:"estudiante_nombre"`
	Curso            string `json:"curso"`
	Completada       bool   `json:"completada"`
	Alerta           bool   `json:"alerta"`
}

type FiltroCitasDTO struct {
	Tipo      string `json:"tipo"`
	FechaSolo string `json:"fecha_solo"`
}

// CampoCertificadoDTO es un campo del formulario de "Generar certificado".
type CampoCertificadoDTO struct {
	Tag        string `json:"tag"`
	Valor      string `json:"valor"`
	Automatico bool   `json:"automatico"` // lo completa el sistema; el usuario puede corregirlo
}

// DatosCertificadoDTO son los campos de la plantilla en el orden en que aparecen en el documento.
type DatosCertificadoDTO struct {
	Campos []CampoCertificadoDTO `json:"campos"`
}
