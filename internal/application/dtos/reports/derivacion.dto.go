package reports

type DerivacionDTO struct {
	CodigoCaso        string `json:"codigo_caso" gorm:"column:codigo_caso"`
	FechaDeteccion    string `json:"fecha_deteccion" gorm:"column:fecha_deteccion"`
	Cedula            string `json:"cedula" gorm:"column:cedula"`
	Estudiante        string `json:"estudiante" gorm:"column:estudiante"`
	Curso             string `json:"curso" gorm:"column:curso"`
	TipoCaso          string `json:"tipo_caso" gorm:"column:tipo_caso"`
	EntidadDerivacion string `json:"entidad_derivacion" gorm:"column:entidad_derivacion"`
	Estado            string `json:"estado" gorm:"column:estado"`
}
