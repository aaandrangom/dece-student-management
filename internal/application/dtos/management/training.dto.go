package management

type CapacitacionResumenDTO struct {
	ID                    uint   `json:"id"`
	Fecha                 string `json:"fecha"`
	Tema                  string `json:"tema"`
	GrupoObjetivo         string `json:"grupo_objetivo"` // Ej: "Padres de Familia"
	CantidadBeneficiarios int    `json:"cantidad_beneficiarios"`
	TieneEvidencia        bool   `json:"tiene_evidencia"` // Para mostrar icono de check
	RutaEvidencia         string `json:"ruta_evidencia"`  // Para la vista previa
}

type AulaDTO struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
}

// DTO para Crear o Editar (Formulario)
type GuardarCapacitacionDTO struct {
	ID    uint   `json:"id"`
	Tema  string `json:"tema" validate:"required"`
	Fecha string `json:"fecha" validate:"required"`

	// Campos "aplanados" que luego irán al JSON
	GrupoObjetivo         string `json:"grupo_objetivo"`
	JornadaDocentes       string `json:"jornada_docentes"`
	CursoID               uint   `json:"curso_id"`
	GradoEspecifico       string `json:"grado_especifico"`
	ParaleloEspecifico    string `json:"paralelo_especifico"`
	CantidadBeneficiarios int    `json:"cantidad_beneficiarios"`
}

type AlertaDashboardDTO struct {
	ID            uint   `json:"id"`
	Titulo        string `json:"titulo"`         // Ej: "Cita con Fiscalía"
	Descripcion   string `json:"descripcion"`    // Ej: "Estudiante Juan Perez - 10mo A"
	FechaHora     string `json:"fecha_hora"`     // "2025-10-20 14:00"
	DiasRestantes int    `json:"dias_restantes"` // Cuántos días faltan (para ordenar urgencia)
	NivelUrgencia string `json:"nivel_urgencia"` // "Alta" (hoy/mañana), "Media"
	Color         string `json:"color"`          // "red", "orange", "blue" (para el UI)
}
