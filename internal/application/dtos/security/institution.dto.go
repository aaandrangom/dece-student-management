package dtos

type AutoridadDTO struct {
	Cedula    string `json:"cedula"`
	Nombres   string `json:"nombres"`
	Apellidos string `json:"apellidos"`
	Telefono  string `json:"telefono"`
	Jornada   string `json:"jornada"`
}

type AutoridadesInstitucionDTO struct {
	Rector                AutoridadDTO `json:"rector"`
	SubdirectorMatutina   AutoridadDTO `json:"subdirector_matutina"`
	SubdirectorVespertina AutoridadDTO `json:"subdirector_vespertina"`
	InspectorGeneral      AutoridadDTO `json:"inspector_general"`
	Subinspector          AutoridadDTO `json:"subinspector"`
	CoordinadorDECE       AutoridadDTO `json:"coordinador_dece"`
	AnalistaDECE1         AutoridadDTO `json:"analista_dece_1"`
	AnalistaDECE2         AutoridadDTO `json:"analista_dece_2"`
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
