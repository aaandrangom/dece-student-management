package academic

import (
	academicDTO "dece/internal/application/dtos/academic"
	"dece/internal/domain/academic"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type LevelService struct {
	db *gorm.DB
}

func NewLevelService(db *gorm.DB) *LevelService {
	return &LevelService{db: db}
}

func (s *LevelService) ListarNiveles() ([]academicDTO.NivelEducativoDTO, error) {
	var niveles []academic.NivelEducativo

	result := s.db.Order("orden asc").Find(&niveles)
	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]academicDTO.NivelEducativoDTO, len(niveles))
	for i, n := range niveles {
		response[i] = academicDTO.NivelEducativoDTO{
			ID:             n.ID,
			Nombre:         n.Nombre,
			NombreCompleto: n.NombreCompleto,
			Orden:          n.Orden,
		}
	}

	return response, nil
}

func (s *LevelService) CrearNivel(input academicDTO.NivelEducativoDTO) error {

	var countNombre int64
	s.db.Model(&academic.NivelEducativo{}).Where("nombre = ?", input.Nombre).Count(&countNombre)
	if countNombre > 0 {
		return fmt.Errorf("Ya existe un nivel con el nombre '%s'", input.Nombre)
	}

	var countOrden int64
	s.db.Model(&academic.NivelEducativo{}).Where("orden = ?", input.Orden).Count(&countOrden)
	if countOrden > 0 {
		return fmt.Errorf("Ya existe un nivel configurado con el número de orden %d", input.Orden)
	}

	nuevoNivel := academic.NivelEducativo{
		Nombre:         input.Nombre,
		NombreCompleto: input.NombreCompleto,
		Orden:          input.Orden,
	}

	if err := s.db.Create(&nuevoNivel).Error; err != nil {
		return err
	}

	return nil
}

func (s *LevelService) ActualizarNivel(input academicDTO.NivelEducativoDTO) error {
	var nivel academic.NivelEducativo

	if err := s.db.First(&nivel, input.ID).Error; err != nil {
		return errors.New("El nivel educativo no existe")
	}

	var countNombre int64
	s.db.Model(&academic.NivelEducativo{}).
		Where("nombre = ? AND id <> ?", input.Nombre, input.ID).
		Count(&countNombre)
	if countNombre > 0 {
		return fmt.Errorf("Ya existe otro nivel con el nombre '%s'", input.Nombre)
	}

	var countOrden int64
	s.db.Model(&academic.NivelEducativo{}).
		Where("orden = ? AND id <> ?", input.Orden, input.ID).
		Count(&countOrden)
	if countOrden > 0 {
		return fmt.Errorf("Ya existe otro nivel con el orden %d", input.Orden)
	}

	nivel.Nombre = input.Nombre
	nivel.NombreCompleto = input.NombreCompleto
	nivel.Orden = input.Orden

	return s.db.Save(&nivel).Error
}

func (s *LevelService) EliminarNivel(id uint) error {
	var nivel academic.NivelEducativo

	if err := s.db.First(&nivel, id).Error; err != nil {
		return errors.New("Nivel educativo no encontrado")
	}

	var totalCursos int64
	s.db.Table("cursos").Where("nivel_id = ?", id).Count(&totalCursos)

	if totalCursos > 0 {
		return fmt.Errorf("No se puede eliminar: existen %d cursos (aulas) asociados a este nivel educativo. Elimine los cursos primero.", totalCursos)
	}

	return s.db.Delete(&nivel).Error
}
