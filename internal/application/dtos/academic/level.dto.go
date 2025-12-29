package academic

type NivelEducativoDTO struct {
	ID             uint   `json:"id"`
	Nombre         string `json:"nombre" validate:"required"`
	NombreCompleto string `json:"nombre_completo" validate:"required"`
	Orden          int    `json:"orden" validate:"required,min=1"`
}
