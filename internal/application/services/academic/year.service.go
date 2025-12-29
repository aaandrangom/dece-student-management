package academic

import (
	academicDTO "dece/internal/application/dtos/academic"
	"dece/internal/domain/academic"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type YearService struct {
	db *gorm.DB
}

func NewYearService(db *gorm.DB) *YearService {
	return &YearService{db: db}
}

func (s *YearService) CrearPeriodo(input academicDTO.CrearPeriodoDTO) error {
	fechaInicio, err := time.Parse(time.RFC3339, input.FechaInicio)
	if err != nil {
		return fmt.Errorf("fecha_inicio inválida: %v", err)
	}
	fechaFin, err := time.Parse(time.RFC3339, input.FechaFin)
	if err != nil {
		return fmt.Errorf("fecha_fin inválida: %v", err)
	}

	if fechaInicio.After(fechaFin) {
		return errors.New("la fecha de inicio no puede ser posterior a la fecha de fin")
	}

	var countNombre int64
	s.db.Model(&academic.PeriodoLectivo{}).
		Where("nombre = ?", input.Nombre).
		Count(&countNombre)

	if countNombre > 0 {
		return fmt.Errorf("ya existe un periodo registrado con el nombre '%s'", input.Nombre)
	}

	var countFechas int64
	s.db.Model(&academic.PeriodoLectivo{}).
		Where("fecha_inicio = ? AND fecha_fin = ?", fechaInicio, fechaFin).
		Count(&countFechas)

	if countFechas > 0 {
		return errors.New("ya existe un periodo con exactamente las mismas fechas de inicio y fin")
	}

	nuevoPeriodo := academic.PeriodoLectivo{
		Nombre:      input.Nombre,
		FechaInicio: fechaInicio,
		FechaFin:    fechaFin,
		EsActivo:    false,
		Cerrado:     false,
	}

	if err := s.db.Create(&nuevoPeriodo).Error; err != nil {
		return fmt.Errorf("Error interno al crear el periodo: %v", err)
	}

	return nil
}

func (s *YearService) ListarPeriodos() ([]academicDTO.PeriodoResponseDTO, error) {
	var periodos []academic.PeriodoLectivo

	result := s.db.Order("fecha_inicio desc").Find(&periodos)
	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]academicDTO.PeriodoResponseDTO, len(periodos))
	for i, p := range periodos {
		estado := "Inactivo"
		if p.EsActivo {
			estado = "En Curso"
		} else if time.Now().After(p.FechaFin) {
			estado = "Finalizado"
		}

		response[i] = academicDTO.PeriodoResponseDTO{
			ID:          p.ID,
			Nombre:      p.Nombre,
			FechaInicio: p.FechaInicio.Format(time.RFC3339),
			FechaFin:    p.FechaFin.Format(time.RFC3339),
			EsActivo:    p.EsActivo,
			Cerrado:     p.Cerrado,
			Estado:      estado,
		}
	}

	return response, nil
}

func (s *YearService) ActivarPeriodo(id uint) error {
	tx := s.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if err := tx.Model(&academic.PeriodoLectivo{}).
		Where("es_activo = ?", true).
		Update("es_activo", false).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Do not allow activating a closed period
	var target academic.PeriodoLectivo
	if err := tx.First(&target, id).Error; err != nil {
		tx.Rollback()
		return errors.New("el periodo seleccionado no existe")
	}
	if target.Cerrado {
		tx.Rollback()
		return errors.New("no se puede activar un periodo cerrado")
	}

	result := tx.Model(&academic.PeriodoLectivo{}).
		Where("id = ?", id).
		Update("es_activo", true)

	if result.Error != nil {
		tx.Rollback()
		return result.Error
	}

	if result.RowsAffected == 0 {
		tx.Rollback()
		return errors.New("el periodo seleccionado no existe")
	}

	return tx.Commit().Error
}

func (s *YearService) ObtenerPeriodoActivo() (*academicDTO.PeriodoResponseDTO, error) {
	var periodo academic.PeriodoLectivo

	if err := s.db.Where("es_activo = ?", true).First(&periodo).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("no hay ningún periodo lectivo activo configurado")
		}
		return nil, err
	}

	return &academicDTO.PeriodoResponseDTO{
		ID:          periodo.ID,
		Nombre:      periodo.Nombre,
		FechaInicio: periodo.FechaInicio.Format(time.RFC3339),
		FechaFin:    periodo.FechaFin.Format(time.RFC3339),
		EsActivo:    true,
		Estado:      "Activo",
	}, nil
}

func (s *YearService) ActualizarPeriodo(input academicDTO.ActualizarPeriodoDTO) error {
	var periodo academic.PeriodoLectivo

	if err := s.db.First(&periodo, input.ID).Error; err != nil {
		return errors.New("El periodo lectivo que intenta editar no existe")
	}

	// Parsear fechas desde strings RFC3339
	fechaInicio, err := time.Parse(time.RFC3339, input.FechaInicio)
	if err != nil {
		return fmt.Errorf("fecha_inicio inválida: %v", err)
	}
	fechaFin, err := time.Parse(time.RFC3339, input.FechaFin)
	if err != nil {
		return fmt.Errorf("fecha_fin inválida: %v", err)
	}

	if fechaInicio.After(fechaFin) {
		return errors.New("La fecha de inicio no puede ser posterior a la fecha de fin")
	}

	if periodo.Cerrado {
		return errors.New("No se puede modificar un periodo cerrado")
	}

	var countNombre int64
	s.db.Model(&academic.PeriodoLectivo{}).
		Where("nombre = ? AND id <> ?", input.Nombre, input.ID).
		Count(&countNombre)

	if countNombre > 0 {
		return fmt.Errorf("Ya existe otro periodo registrado con el nombre '%s'", input.Nombre)
	}

	var countFechas int64
	s.db.Model(&academic.PeriodoLectivo{}).
		Where("fecha_inicio = ? AND fecha_fin = ? AND id <> ?", fechaInicio, fechaFin, input.ID).
		Count(&countFechas)

	if countFechas > 0 {
		return errors.New("ya existe otro periodo con exactamente las mismas fechas de inicio y fin")
	}

	periodo.Nombre = input.Nombre
	periodo.FechaInicio = fechaInicio
	periodo.FechaFin = fechaFin

	if err := s.db.Save(&periodo).Error; err != nil {
		return fmt.Errorf("error al actualizar el periodo: %v", err)
	}

	return nil
}

func (s *YearService) EliminarPeriodo(id uint) error {
	var periodo academic.PeriodoLectivo

	if err := s.db.First(&periodo, id).Error; err != nil {
		return errors.New("El periodo lectivo no existe")
	}

	if periodo.EsActivo {
		return errors.New("No se puede eliminar el periodo lectivo que está ACTIVO actualmente")
	}

	if periodo.Cerrado {
		return errors.New("No se puede eliminar un periodo cerrado")
	}

	var totalMatriculas int64
	s.db.Table("matriculas").
		Joins("INNER JOIN cursos ON cursos.id = matriculas.curso_id").
		Where("cursos.periodo_id = ?", id).
		Count(&totalMatriculas)

	if totalMatriculas > 0 {
		return fmt.Errorf("Imposible eliminar: existen %d estudiantes matriculados en este periodo", totalMatriculas)
	}

	var totalCasos int64
	s.db.Table("casos_sensibles").Where("periodo_id = ?", id).Count(&totalCasos)
	if totalCasos > 0 {
		return fmt.Errorf("Imposible eliminar: existen %d casos sensibles registrados en este periodo", totalCasos)
	}

	var totalCapacitaciones int64
	s.db.Table("capacitaciones").Where("periodo_id = ?", id).Count(&totalCapacitaciones)
	if totalCapacitaciones > 0 {
		return fmt.Errorf("Imposible eliminar: existen %d capacitaciones registradas en este periodo", totalCapacitaciones)
	}

	var totalCursos int64
	s.db.Table("cursos").Where("periodo_id = ?", id).Count(&totalCursos)
	if totalCursos > 0 {
		return fmt.Errorf("No se puede eliminar: existen %d cursos creados (aulas) asociados a este periodo. Elimine los cursos primero.", totalCursos)
	}

	if err := s.db.Delete(&periodo).Error; err != nil {
		return fmt.Errorf("Error de base de datos al eliminar: %v", err)
	}

	return nil
}

// CerrarPeriodo marca un periodo como cerrado y lo desactiva. Un periodo cerrado no puede reabrirse.
func (s *YearService) CerrarPeriodo(id uint) error {
	var periodo academic.PeriodoLectivo

	if err := s.db.First(&periodo, id).Error; err != nil {
		return errors.New("El periodo lectivo no existe")
	}

	if periodo.Cerrado {
		return errors.New("El periodo ya está cerrado")
	}

	// Desactivar y marcar como cerrado
	periodo.EsActivo = false
	periodo.Cerrado = true

	if err := s.db.Save(&periodo).Error; err != nil {
		return fmt.Errorf("error al cerrar el periodo: %v", err)
	}

	return nil
}
