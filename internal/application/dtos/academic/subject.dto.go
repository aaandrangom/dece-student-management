package academic

type MateriaDTO struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre" validate:"required"`
	Area   string `json:"area" validate:"required"`
}
