package reports

type BitacoraKPIsDTO struct {
	CitasRealizadas     int `json:"citas_realizadas" gorm:"column:citas_realizadas"`
	TalleresDictados    int `json:"talleres_dictados" gorm:"column:talleres_dictados"`
	PersonasCapacitadas int `json:"personas_capacitadas" gorm:"column:personas_capacitadas"`
}

type BitacoraTallerDTO struct {
	Fecha      string `json:"fecha"`
	Tema       string `json:"tema"`
	Grupo      string `json:"grupo"`
	Asistentes int    `json:"asistentes"`
}

type BitacoraGestionDTO struct {
	KPIs     BitacoraKPIsDTO     `json:"kpis"`
	Talleres []BitacoraTallerDTO `json:"talleres"`
}
