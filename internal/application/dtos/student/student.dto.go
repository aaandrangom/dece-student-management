package student

type EstudianteListaDTO struct {
	ID              uint   `json:"id"`
	Cedula          string `json:"cedula"`
	Apellidos       string `json:"apellidos"`
	Nombres         string `json:"nombres"`
	RutaFoto        string `json:"ruta_foto"`
	FechaNacimiento string `json:"fecha_nacimiento"`
	Edad            int    `json:"edad"`
}

type DatosFamiliarDTO struct {
	NivelInstruccion string `json:"nivel_instruccion"`
	Profesion        string `json:"profesion"`
	LugarTrabajo     string `json:"lugar_trabajo"`
}

type GuardarFamiliarDTO struct {
	ID                   uint   `json:"id"`
	Cedula               string `json:"cedula"`
	NombresCompletos     string `json:"nombres_completos"`
	Parentesco           string `json:"parentesco"`
	EsRepresentanteLegal bool   `json:"es_representante_legal"`
	ViveConEstudiante    bool   `json:"vive_con_estudiante"`
	TelefonoPersonal     string `json:"telefono_personal"`
	Fallecido            bool   `json:"fallecido"`

	DatosExtendidos DatosFamiliarDTO `json:"datos_extendidos"`
}

type GuardarEstudianteDTO struct {
	ID               uint   `json:"id"`
	Cedula           string `json:"cedula" validate:"required,len=10"`
	Apellidos        string `json:"apellidos" validate:"required"`
	Nombres          string `json:"nombres" validate:"required"`
	FechaNacimiento  string `json:"fecha_nacimiento"`
	GeneroNacimiento string `json:"genero_nacimiento"`

	RutaFoto string `json:"ruta_foto"`

	EsExtranjero   bool                 `json:"es_extranjero"`
	PaisOrigen     string               `json:"pais_origen"`
	PasaporteOrDNI string               `json:"pasaporte_odni"`
	Familiares     []GuardarFamiliarDTO `json:"familiares"`
}
