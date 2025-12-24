package academic

import (
	"dece/internal/domain/academic"
	"errors"

	"gorm.io/gorm"
)

type CourseService struct {
	db *gorm.DB
}

func NewCourseService(db *gorm.DB) *CourseService {
	return &CourseService{db: db}
}

func (s *CourseService) GetCursos() ([]academic.Curso, error) {
	var cursos []academic.Curso
	result := s.db.Order("nivel asc").Find(&cursos)
	return cursos, result.Error
}

func (s *CourseService) CreateCurso(nombre string, nivel int) (academic.Curso, error) {
	// Validar duplicados
	var count int64
	s.db.Model(&academic.Curso{}).Where("nombre = ?", nombre).Count(&count)
	if count > 0 {
		return academic.Curso{}, errors.New("ya existe un curso con ese nombre")
	}

	curso := academic.Curso{
		Nombre: nombre,
		Nivel:  nivel,
	}

	result := s.db.Create(&curso)
	return curso, result.Error
}

func (s *CourseService) UpdateCurso(id uint, nombre string, nivel int) error {
	// Validar duplicados (excluyendo el actual)
	var count int64
	s.db.Model(&academic.Curso{}).Where("nombre = ? AND id != ?", nombre, id).Count(&count)
	if count > 0 {
		return errors.New("ya existe otro curso con ese nombre")
	}

	return s.db.Model(&academic.Curso{}).Where("id = ?", id).Updates(map[string]interface{}{
		"nombre": nombre,
		"nivel":  nivel,
	}).Error
}

func (s *CourseService) DeleteCurso(id uint) error {
	// Validar uso en Aulas
	var count int64
	s.db.Model(&academic.Aula{}).Where("curso_id = ?", id).Count(&count)
	if count > 0 {
		return errors.New("no se puede eliminar el curso porque está asignado a una o más aulas")
	}

	return s.db.Delete(&academic.Curso{}, id).Error
}
