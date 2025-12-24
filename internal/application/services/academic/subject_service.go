package academic

import (
	"dece/internal/domain/academic"
	"errors"

	"gorm.io/gorm"
)

type SubjectService struct {
	db *gorm.DB
}

func NewSubjectService(db *gorm.DB) *SubjectService {
	return &SubjectService{db: db}
}

func (s *SubjectService) GetMaterias() ([]academic.Materia, error) {
	var materias []academic.Materia
	result := s.db.Order("area asc, nombre asc").Find(&materias)
	return materias, result.Error
}

func (s *SubjectService) CreateMateria(nombre string, area string) (academic.Materia, error) {
	// Validar duplicados
	var count int64
	s.db.Model(&academic.Materia{}).Where("nombre = ?", nombre).Count(&count)
	if count > 0 {
		return academic.Materia{}, errors.New("ya existe una materia con ese nombre")
	}

	materia := academic.Materia{
		Nombre: nombre,
		Area:   area,
		Activo: true,
	}

	result := s.db.Create(&materia)
	return materia, result.Error
}

func (s *SubjectService) UpdateMateria(id uint, nombre string, area string) error {
	// Validar duplicados (excluyendo el actual)
	var count int64
	s.db.Model(&academic.Materia{}).Where("nombre = ? AND id != ?", nombre, id).Count(&count)
	if count > 0 {
		return errors.New("ya existe otra materia con ese nombre")
	}

	return s.db.Model(&academic.Materia{}).Where("id = ?", id).Updates(map[string]interface{}{
		"nombre": nombre,
		"area":   area,
	}).Error
}

func (s *SubjectService) ToggleMateriaState(id uint) error {
	var materia academic.Materia
	if err := s.db.First(&materia, id).Error; err != nil {
		return err
	}

	return s.db.Model(&materia).Update("activo", !materia.Activo).Error
}
