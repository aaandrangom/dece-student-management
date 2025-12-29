package services

import (
	teacherDTO "dece/internal/application/dtos/faculty"
	"dece/internal/domain/faculty"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

type TeacherService struct {
	db *gorm.DB
}

func NewTeacherService(db *gorm.DB) *TeacherService {
	return &TeacherService{db: db}
}

func (s *TeacherService) ListarDocentes(soloActivos bool) ([]teacherDTO.DocenteDTO, error) {
	var docentes []faculty.Docente
	var result *gorm.DB

	query := s.db.Order("nombres_completos asc")

	if soloActivos {
		query = query.Where("activo = ?", true)
	}

	result = query.Find(&docentes)
	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]teacherDTO.DocenteDTO, len(docentes))
	for i, d := range docentes {
		response[i] = teacherDTO.DocenteDTO{
			ID:               d.ID,
			Cedula:           d.Cedula,
			NombresCompletos: d.NombresCompletos,
			Telefono:         d.Telefono,
			Correo:           d.Correo,
			Activo:           d.Activo,
		}
	}

	return response, nil
}

func (s *TeacherService) CrearDocente(input teacherDTO.GuardarDocenteDTO) error {
	cedulaLimpia := strings.TrimSpace(input.Cedula)

	var count int64
	s.db.Model(&faculty.Docente{}).Where("cedula = ?", cedulaLimpia).Count(&count)
	if count > 0 {
		return fmt.Errorf("ya existe un docente registrado con la cédula %s", cedulaLimpia)
	}

	nuevoDocente := faculty.Docente{
		Cedula:           cedulaLimpia,
		NombresCompletos: strings.TrimSpace(input.NombresCompletos),
		Telefono:         strings.TrimSpace(input.Telefono),
		Correo:           strings.TrimSpace(input.Correo),
		Activo:           true,
	}

	if err := s.db.Create(&nuevoDocente).Error; err != nil {
		return fmt.Errorf("error al guardar docente: %v", err)
	}

	return nil
}

func (s *TeacherService) ActualizarDocente(input teacherDTO.GuardarDocenteDTO) error {
	var docente faculty.Docente

	if err := s.db.First(&docente, input.ID).Error; err != nil {
		return errors.New("docente no encontrado")
	}

	cedulaLimpia := strings.TrimSpace(input.Cedula)

	var count int64
	s.db.Model(&faculty.Docente{}).
		Where("cedula = ? AND id <> ?", cedulaLimpia, input.ID).
		Count(&count)

	if count > 0 {
		return fmt.Errorf("la cédula %s ya pertenece a otro docente", cedulaLimpia)
	}

	docente.Cedula = cedulaLimpia
	docente.NombresCompletos = strings.TrimSpace(input.NombresCompletos)
	docente.Telefono = strings.TrimSpace(input.Telefono)
	docente.Correo = strings.TrimSpace(input.Correo)

	return s.db.Save(&docente).Error
}

func (s *TeacherService) ToggleEstado(id uint) error {
	var docente faculty.Docente

	if err := s.db.First(&docente, id).Error; err != nil {
		return errors.New("docente no encontrado")
	}

	nuevoEstado := !docente.Activo
	docente.Activo = nuevoEstado

	if err := s.db.Model(&docente).Update("activo", nuevoEstado).Error; err != nil {
		return err
	}

	// Mensaje de log opcional
	// estadoTexto := "activado"
	// if !nuevoEstado { estadoTexto = "desactivado" }
	// fmt.Printf("Docente %s %s\n", docente.NombresCompletos, estadoTexto)

	return nil
}
