package tracking

type LlamadoResumenDTO struct {
	ID     uint   `json:"id"`
	Fecha  string `json:"fecha"`
	Motivo string `json:"motivo"`
	Medida string `json:"medida"`
	Estado string `json:"estado"`
}

type GuardarLlamadoDTO struct {
	ID          uint   `json:"id"`
	MatriculaID uint   `json:"matricula_id" validate:"required"`
	Fecha       string `json:"fecha" validate:"required"`
	Motivo      string `json:"motivo" validate:"required"`

	RepresentanteNotificado bool   `json:"representante_notificado"`
	RepresentanteFirmo      bool   `json:"representante_firmo"`
	MotivoNoFirma           string `json:"motivo_no_firma"`

	MedidaDisciplinaria  string `json:"medida_disciplinaria"`
	CumplioMedida        bool   `json:"cumplio_medida"`
	MotivoIncumplimiento string `json:"motivo_incumplimiento"`

	RutaActa       string `json:"ruta_acta"`
	RutaResolucion string `json:"ruta_resolucion"`
}

type EstudianteDisciplinaDTO struct {
	ID        uint   `json:"id"`
	Cedula    string `json:"cedula"`
	Nombres   string `json:"nombres"`
	Apellidos string `json:"apellidos"`
	RutaFoto  string `json:"ruta_foto"`

	MatriculaID uint   `json:"matricula_id"`
	Curso       string `json:"curso"`
}
