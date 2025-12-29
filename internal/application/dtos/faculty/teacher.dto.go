package faculty

type DocenteDTO struct {
	ID               uint   `json:"id"`
	Cedula           string `json:"cedula" validate:"required,len=10,numeric"`
	NombresCompletos string `json:"nombres_completos" validate:"required"`
	Telefono         string `json:"telefono"`
	Correo           string `json:"correo" validate:"omitempty,email"`
	Activo           bool   `json:"activo"`
}

type GuardarDocenteDTO struct {
	ID               uint   `json:"id"`
	Cedula           string `json:"cedula" validate:"required,len=10"`
	NombresCompletos string `json:"nombres_completos" validate:"required"`
	Telefono         string `json:"telefono"`
	Correo           string `json:"correo"`
}
