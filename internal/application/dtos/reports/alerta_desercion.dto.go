package reports

type AlertaDesercionDTO struct {
	Cedula       string `json:"cedula" gorm:"column:cedula"`
	Estudiante   string `json:"estudiante" gorm:"column:estudiante"`
	Curso        string `json:"curso" gorm:"column:curso"`
	Origen       string `json:"origen" gorm:"column:origen"`
	FechaReporte string `json:"fecha_reporte" gorm:"column:fecha_reporte"`
	Detalle      string `json:"detalle" gorm:"column:detalle"`
}
