package dashboard

type KPIDashboardDTO struct {
	TotalEstudiantes int64 `json:"total_estudiantes"`
	CasosAbiertos    int64 `json:"casos_abiertos"`
	CitasPendientes  int64 `json:"citas_pendientes"`
	SancionesMes     int64 `json:"sanciones_mes"`
}

type CitaProximaDTO struct {
	Estudiante string `json:"estudiante"`
	Curso      string `json:"curso"`
	Entidad    string `json:"entidad"`
	Motivo     string `json:"motivo"`
	FechaCita  string `json:"fecha_cita"`
	DiasAlerta int    `json:"dias_alerta"`
}

type CursoConflictivoDTO struct {
	Curso          string `json:"curso"`
	CantidadFaltas int    `json:"cantidad_faltas"`
}

type CasoPorTipoDTO struct {
	TipoCaso string `json:"tipo_caso"`
	Cantidad int    `json:"cantidad"`
}

type GeneroDTO struct {
	Genero   string `json:"genero"`
	Cantidad int    `json:"cantidad"`
}

type ActividadDTO struct {
	Tipo        string `json:"tipo"`
	Fecha       string `json:"fecha"`
	Descripcion string `json:"descripcion"`
	Estudiante  string `json:"estudiante"`
}

type DashboardDataDTO struct {
	KPI                KPIDashboardDTO       `json:"kpi"`
	CitasProximas      []CitaProximaDTO      `json:"citas_proximas"`
	CursosConflictivos []CursoConflictivoDTO `json:"cursos_conflictivos"`
	CasosPorTipo       []CasoPorTipoDTO      `json:"casos_por_tipo"`
	EstudiantesGenero  []GeneroDTO           `json:"estudiantes_genero"`
	ActividadReciente  []ActividadDTO        `json:"actividad_reciente"`
}
