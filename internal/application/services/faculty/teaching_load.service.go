package services

import (
	teachingLoadDTO "dece/internal/application/dtos/faculty"
	"dece/internal/domain/faculty"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type DistributivoService struct {
	db *gorm.DB
}

func NewDistributivoService(db *gorm.DB) *DistributivoService {
	return &DistributivoService{db: db}
}

func (s *DistributivoService) ObtenerDistributivo(cursoID uint) ([]teachingLoadDTO.ItemDistributivoDTO, error) {
	var resultados []teachingLoadDTO.ItemDistributivoDTO

	query := `
        SELECT 
            m.id as materia_id, 
            m.nombre as materia_nombre, 
            m.area,
            d.id as docente_id, 
            d.nombres_completos as docente_nombre
        FROM materia m
        LEFT JOIN distributivo_materia dm ON dm.materia_id = m.id AND dm.curso_id = ?
        LEFT JOIN docentes d ON dm.docente_id = d.id
        ORDER BY m.area ASC, m.nombre ASC
    `

	if err := s.db.Raw(query, cursoID).Scan(&resultados).Error; err != nil {
		return nil, fmt.Errorf("error al cargar el distributivo: %v", err)
	}

	for i := range resultados {
		if resultados[i].DocenteID == nil || *resultados[i].DocenteID == 0 {
			resultados[i].DocenteNombre = "Sin Asignar"
		}
	}

	return resultados, nil
}

func (s *DistributivoService) AsignarDocenteMateria(input teachingLoadDTO.AsignarDocenteDTO) error {
	var asignacion faculty.DistributivoMateria

	result := s.db.Where("curso_id = ? AND materia_id = ?", input.CursoID, input.MateriaID).First(&asignacion)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			nuevaAsignacion := faculty.DistributivoMateria{
				CursoID:   input.CursoID,
				MateriaID: input.MateriaID,
				DocenteID: input.DocenteID,
			}
			if err := s.db.Create(&nuevaAsignacion).Error; err != nil {
				return fmt.Errorf("error al crear asignación: %v", err)
			}
		} else {
			return result.Error
		}
	} else {
		asignacion.DocenteID = input.DocenteID
		if err := s.db.Save(&asignacion).Error; err != nil {
			return fmt.Errorf("error al actualizar asignación: %v", err)
		}
	}

	return nil
}

func (s *DistributivoService) EliminarAsignacion(cursoID uint, materiaID uint) error {

	result := s.db.Where("curso_id = ? AND materia_id = ?", cursoID, materiaID).
		Delete(&faculty.DistributivoMateria{})

	if result.Error != nil {
		return fmt.Errorf("error al eliminar la asignación: %v", result.Error)
	}

	if result.RowsAffected == 0 {
		return errors.New("no existe asignación para eliminar en esta materia")
	}

	return nil
}
