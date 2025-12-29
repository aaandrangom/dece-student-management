package dtos

// FechaActualizacion se expone como string RFC3339 para bindings

type AutoridadDTO struct {
	Cedula    string `json:"cedula"`
	Nombres   string `json:"nombres"`
	Apellidos string `json:"apellidos"`
	Telefono  string `json:"telefono"`
	Jornada   string `json:"jornada"`
}

type AutoridadesInstitucionDTO struct {
	Rector           AutoridadDTO `json:"rector"`
	Subdirector      AutoridadDTO `json:"subdirector"`
	InspectorGeneral AutoridadDTO `json:"inspector_general"`
	ResponsableDECE  AutoridadDTO `json:"responsable_dece"`
}

type DetalleUbicacionDTO struct {
	Provincia     string `json:"provincia"`
	Canton        string `json:"canton"`
	Parroquia     string `json:"parroquia"`
	BarrioRecinto string `json:"barrio_recinto"`
}

type ConfiguracionInstitucionalDTO struct {
	Nombre             string                    `json:"nombre"`
	CodigoAMIE         string                    `json:"codigo_amie"`
	Distrito           string                    `json:"distrito"`
	Circuito           string                    `json:"circuito"`
	Ubicacion          DetalleUbicacionDTO       `json:"detalle_ubicacion"`
	Autoridades        AutoridadesInstitucionDTO `json:"autoridades"`
	FechaActualizacion string                    `json:"fecha_actualizacion"`
}
