package academic

import (
	"dece/internal/domain/academic"
	"errors"

	"gorm.io/gorm"
)

type ParallelService struct {
	db *gorm.DB
}

func NewParallelService(db *gorm.DB) *ParallelService {
	return &ParallelService{db: db}
}

func (s *ParallelService) GetParalelos() ([]academic.Paralelo, error) {
	var paralelos []academic.Paralelo
	result := s.db.Order("nombre asc").Find(&paralelos)
	return paralelos, result.Error
}

func (s *ParallelService) CreateParalelo(nombre string) (academic.Paralelo, error) {
	// Validar duplicados
	var count int64
	s.db.Model(&academic.Paralelo{}).Where("nombre = ?", nombre).Count(&count)
	if count > 0 {
		return academic.Paralelo{}, errors.New("ya existe un paralelo con ese nombre")
	}

	paralelo := academic.Paralelo{
		Nombre: nombre,
	}

	result := s.db.Create(&paralelo)
	return paralelo, result.Error
}

func (s *ParallelService) DeleteParalelo(id uint) error {
	// Validar uso en Aulas
	var count int64
	s.db.Model(&academic.Aula{}).Where("paralelo_id = ?", id).Count(&count)
	if count > 0 {
		return errors.New("no se puede eliminar el paralelo porque está asignado a una o más aulas")
	}

	return s.db.Delete(&academic.Paralelo{}, id).Error
}
