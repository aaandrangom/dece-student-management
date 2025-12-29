package academic

import (
	subjectDTO "dece/internal/application/dtos/academic"
	"dece/internal/domain/academic"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

type SubjectService struct {
	db *gorm.DB
}

func NewSubjectService(db *gorm.DB) *SubjectService {
	return &SubjectService{db: db}
}

func (s *SubjectService) ListarMaterias() ([]subjectDTO.MateriaDTO, error) {
	var materias []academic.Materia

	result := s.db.Order("nombre asc").Find(&materias)
	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]subjectDTO.MateriaDTO, len(materias))
	for i, m := range materias {
		response[i] = subjectDTO.MateriaDTO{
			ID:     m.ID,
			Nombre: m.Nombre,
			Area:   m.Area,
		}
	}

	return response, nil
}

func (s *SubjectService) CrearMateria(input subjectDTO.MateriaDTO) error {
	nombreLimpio := strings.TrimSpace(input.Nombre)

	var count int64
	s.db.Model(&academic.Materia{}).Where("nombre = ?", nombreLimpio).Count(&count)
	if count > 0 {
		return fmt.Errorf("Ya existe una materia registrada con el nombre '%s'", nombreLimpio)
	}

	nuevaMateria := academic.Materia{
		Nombre: nombreLimpio,
		Area:   strings.TrimSpace(input.Area),
	}

	if err := s.db.Create(&nuevaMateria).Error; err != nil {
		return fmt.Errorf("Error al guardar la materia: %v", err)
	}

	return nil
}

func (s *SubjectService) ActualizarMateria(input subjectDTO.MateriaDTO) error {
	var materia academic.Materia

	if err := s.db.First(&materia, input.ID).Error; err != nil {
		return errors.New("La materia no existe")
	}

	nombreLimpio := strings.TrimSpace(input.Nombre)

	var count int64
	s.db.Model(&academic.Materia{}).
		Where("nombre = ? AND id <> ?", nombreLimpio, input.ID).
		Count(&count)

	if count > 0 {
		return fmt.Errorf("Ya existe otra materia con el nombre '%s'", nombreLimpio)
	}

	materia.Nombre = nombreLimpio
	materia.Area = strings.TrimSpace(input.Area)

	return s.db.Save(&materia).Error
}

func (s *SubjectService) EliminarMateria(id uint) error {
	var materia academic.Materia

	if err := s.db.First(&materia, id).Error; err != nil {
		return errors.New("Materia no encontrada")
	}

	var totalAsignaciones int64
	s.db.Table("distributivo_materias").Where("materia_id = ?", id).Count(&totalAsignaciones)

	if totalAsignaciones > 0 {
		return fmt.Errorf("No se puede eliminar la materia '%s': está asignada a %d cursos/profesores en el distributivo", materia.Nombre, totalAsignaciones)
	}

	return s.db.Delete(&materia).Error
}
