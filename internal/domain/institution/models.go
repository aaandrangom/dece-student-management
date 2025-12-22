package institution

type Institucion struct {
	ID         uint `gorm:"primaryKey"`
	Nombre     string
	CodigoAmie string
	Distrito   string
	Circuito   string
	Direccion  string
	LogoPath   string
}

type Rol struct {
	ID     uint   `gorm:"primaryKey"`
	Nombre string `gorm:"unique;not null"`
}

type Usuario struct {
	ID               uint   `gorm:"primaryKey"`
	Username         string `gorm:"unique;not null"`
	PasswordHash     string `gorm:"not null"`
	NombresCompletos string
	RolID            uint
	Rol              Rol  `gorm:"foreignKey:RolID"`
	Activo           bool `gorm:"default:true"`
}
