package faculty

type ItemDistributivoDTO struct {
	MateriaID     uint   `json:"materia_id"`
	MateriaNombre string `json:"materia_nombre"`
	Area          string `json:"area"`

	DocenteID     *uint  `json:"docente_id"`
	DocenteNombre string `json:"docente_nombre"`
}

type AsignarDocenteDTO struct {
	CursoID   uint `json:"curso_id" validate:"required"`
	MateriaID uint `json:"materia_id" validate:"required"`
	DocenteID uint `json:"docente_id" validate:"required"`
}
