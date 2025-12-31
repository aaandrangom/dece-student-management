package academic

type PeriodoLectivo struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Nombre      string `gorm:"unique;not null" json:"nombre"`
	FechaInicio string `json:"fecha_inicio"`
	FechaFin    string `json:"fecha_fin"`
	EsActivo    bool   `gorm:"default:false" json:"es_activo"`
	Cerrado     bool   `gorm:"default:false" json:"cerrado"`
}

type NivelEducativo struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	Nombre         string `gorm:"unique;not null" json:"nombre"`
	NombreCompleto string `gorm:"not null" json:"nombre_completo"`
	Orden          int    `json:"orden"`
}

type Materia struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Nombre string `gorm:"unique;not null" json:"nombre"`
	Area   string `json:"area"`
}
