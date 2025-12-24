package academic

import (
	"time"
)

type AnioLectivo struct {
	ID          uint   `gorm:"primaryKey"`
	Nombre      string `gorm:"not null"`
	FechaInicio time.Time
	FechaFin    time.Time
	Activo      bool `gorm:"default:false"`
	Cerrado     bool `gorm:"default:false"`
}

type Docente struct {
	ID        uint   `gorm:"primaryKey"`
	Cedula    string `gorm:"unique"`
	Apellidos string `gorm:"not null"`
	Nombres   string `gorm:"not null"`
	Telefono  string
	Email     string
	Activo    bool `gorm:"default:true"`
}

type Materia struct {
	ID     uint   `gorm:"primaryKey"`
	Nombre string `gorm:"not null"`
	Area   string
	Activo bool `gorm:"default:true"`
}

type Curso struct {
	ID     uint   `gorm:"primaryKey"`
	Nombre string `gorm:"not null"`
	Nivel  int
}

type Paralelo struct {
	ID     uint   `gorm:"primaryKey"`
	Nombre string `gorm:"not null"`
}

type Aula struct {
	ID             uint `gorm:"primaryKey"`
	AnioLectivoID  uint `gorm:"not null;uniqueIndex:idx_aula_anio_curso_paralelo"`
	CursoID        uint `gorm:"not null;uniqueIndex:idx_aula_anio_curso_paralelo"`
	ParaleloID     uint `gorm:"not null;uniqueIndex:idx_aula_anio_curso_paralelo"`
	TutorDocenteID *uint

	AnioLectivo  AnioLectivo `gorm:"foreignKey:AnioLectivoID"`
	Curso        Curso       `gorm:"foreignKey:CursoID"`
	Paralelo     Paralelo    `gorm:"foreignKey:ParaleloID"`
	TutorDocente *Docente    `gorm:"foreignKey:TutorDocenteID"`
}

type CargaHoraria struct {
	ID        uint `gorm:"primaryKey"`
	AulaID    uint `gorm:"not null"`
	MateriaID uint `gorm:"not null"`
	DocenteID uint `gorm:"not null"`

	Aula    Aula    `gorm:"foreignKey:AulaID"`
	Materia Materia `gorm:"foreignKey:MateriaID"`
	Docente Docente `gorm:"foreignKey:DocenteID"`
}
