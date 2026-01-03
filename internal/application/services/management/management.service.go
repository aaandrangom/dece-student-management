package services

import (
	"context"
	dto "dece/internal/application/dtos/management"
	"dece/internal/domain/management"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

type ManagementService struct {
	db  *gorm.DB
	ctx context.Context
}

func NewManagementService(db *gorm.DB) *ManagementService {
	return &ManagementService{db: db}
}

func (s *ManagementService) Startup(ctx context.Context) {
	s.ctx = ctx
}

// =============================================================================
// AGENDAR CITA
// =============================================================================
func (s *ManagementService) AgendarCita(input dto.AgendarCitaDTO) (*management.Convocatoria, error) {
	// 1. Validar que la fecha no sea en el pasado
	// Formato esperado: YYYY-MM-DD HH:mm (HTML datetime-local input)
	layout := "2006-01-02 15:04"
	fechaParsed, err := time.Parse(layout, input.FechaCita)

	if err == nil {
		// Solo validamos si el parseo fue exitoso.
		// Si la fecha es anterior a "ahora" (con un margen de 5 min por latencia), error.
		if fechaParsed.Before(time.Now().Add(-5 * time.Minute)) {
			return nil, errors.New("no se puede agendar una cita en el pasado")
		}
	}

	// 2. Crear Modelo
	cita := management.Convocatoria{
		MatriculaID:    input.MatriculaID,
		Entidad:        input.Entidad,
		Motivo:         input.Motivo,
		FechaCita:      input.FechaCita,
		DiasAlerta:     input.DiasAlerta,
		CitaCompletada: false, // Por defecto pendiente
	}

	// 3. Guardar
	if err := s.db.Create(&cita).Error; err != nil {
		return nil, fmt.Errorf("error al agendar cita: %v", err)
	}

	return &cita, nil
}

// =============================================================================
// LISTAR CITAS (CON FILTROS Y PRELOAD)
// =============================================================================
func (s *ManagementService) ListarCitas(filtro dto.FiltroCitasDTO) ([]dto.CitaResumenDTO, error) {
	var citas []management.Convocatoria

	// Query Base con Joins necesarios para obtener nombres
	query := s.db.Model(&management.Convocatoria{}).
		Preload("Matricula.Estudiante").
		Preload("Matricula.Curso.Nivel"). // Asumiendo estructura académica
		Order("fecha_cita ASC")           // Las más próximas primero

	// Aplicar Filtros
	if filtro.Tipo == "pendientes" {
		query = query.Where("cita_completada = ?", false)
	} else if filtro.Tipo == "rango" && filtro.FechaSolo != "" {
		// Filtro simple por día (LIKE '2025-10-20%')
		query = query.Where("fecha_cita LIKE ?", filtro.FechaSolo+"%")
	}

	// Ejecutar consulta
	if err := query.Find(&citas).Error; err != nil {
		return nil, err
	}

	// Mapear a DTO Plano
	response := make([]dto.CitaResumenDTO, len(citas))
	layout := "2006-01-02 15:04"
	now := time.Now()

	for i, c := range citas {
		// Construir nombre estudiante y descripción real del curso (si están preloadados)
		nombreEst := "Desconocido"
		cursoStr := "S/C"
		if c.Matricula.ID != 0 {
			// Nombre del estudiante (si existe)
			if c.Matricula.Estudiante.ID != 0 {
				nombreEst = fmt.Sprintf("%s %s", c.Matricula.Estudiante.Apellidos, c.Matricula.Estudiante.Nombres)
			}

			// Construir descripción del curso usando Nivel.Nombre (o NombreCompleto), Paralelo y Jornada si están disponibles
			parts := make([]string, 0, 3)
			if c.Matricula.Curso.Nivel.ID != 0 {
				nivel := c.Matricula.Curso.Nivel.NombreCompleto
				if strings.TrimSpace(nivel) == "" {
					nivel = c.Matricula.Curso.Nivel.Nombre
				}
				if strings.TrimSpace(nivel) != "" {
					parts = append(parts, nivel)
				}
			}
			if strings.TrimSpace(c.Matricula.Curso.Paralelo) != "" {
				parts = append(parts, c.Matricula.Curso.Paralelo)
			}
			if strings.TrimSpace(c.Matricula.Curso.Jornada) != "" {
				parts = append(parts, c.Matricula.Curso.Jornada)
			}

			if len(parts) > 0 {
				cursoStr = strings.Join(parts, " ")
			}
		}

		// Calcular Alerta Visual
		// Si falta menos de X días y no está completada -> Alerta True
		esAlerta := false
		if !c.CitaCompletada {
			fechaCita, _ := time.Parse(layout, c.FechaCita)
			// Si la fecha de la cita - dias de alerta < ahora, entonces estamos en zona de alerta
			fechaAviso := fechaCita.AddDate(0, 0, -c.DiasAlerta)
			if now.After(fechaAviso) && now.Before(fechaCita) {
				esAlerta = true
			}
		}

		response[i] = dto.CitaResumenDTO{
			ID:               c.ID,
			FechaHora:        c.FechaCita,
			Entidad:          c.Entidad,
			Motivo:           c.Motivo,
			EstudianteNombre: nombreEst,
			Curso:            cursoStr,
			Completada:       c.CitaCompletada,
			Alerta:           esAlerta,
		}
	}

	return response, nil
}

// =============================================================================
// MARCAR COMPLETADA (CHECK)
// =============================================================================
func (s *ManagementService) MarcarCompletada(id uint, completada bool) error {
	result := s.db.Model(&management.Convocatoria{}).
		Where("id = ?", id).
		Update("cita_completada", completada)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("cita no encontrada")
	}
	return nil
}

// =============================================================================
// ELIMINAR CITA
// =============================================================================
func (s *ManagementService) EliminarCita(id uint) error {
	return s.db.Delete(&management.Convocatoria{}, id).Error
}

// =============================================================================
// OBTENER CITA (DETALLE)
// =============================================================================
func (s *ManagementService) ObtenerCita(id uint) (*dto.CitaDetalleDTO, error) {
	var cita management.Convocatoria

	if err := s.db.
		Preload("Matricula.Estudiante").
		Preload("Matricula.Curso.Nivel").
		First(&cita, id).Error; err != nil {
		return nil, errors.New("cita no encontrada")
	}

	nombres := ""
	apellidos := ""
	nombreCompleto := "Desconocido"
	cursoStr := "S/C"

	if cita.Matricula.ID != 0 {
		if cita.Matricula.Estudiante.ID != 0 {
			nombres = cita.Matricula.Estudiante.Nombres
			apellidos = cita.Matricula.Estudiante.Apellidos
			nombreCompleto = fmt.Sprintf("%s %s", apellidos, nombres)
		}

		parts := make([]string, 0, 3)
		if cita.Matricula.Curso.Nivel.ID != 0 {
			nivel := cita.Matricula.Curso.Nivel.NombreCompleto
			if strings.TrimSpace(nivel) == "" {
				nivel = cita.Matricula.Curso.Nivel.Nombre
			}
			if strings.TrimSpace(nivel) != "" {
				parts = append(parts, nivel)
			}
		}
		if strings.TrimSpace(cita.Matricula.Curso.Paralelo) != "" {
			parts = append(parts, cita.Matricula.Curso.Paralelo)
		}
		if strings.TrimSpace(cita.Matricula.Curso.Jornada) != "" {
			parts = append(parts, cita.Matricula.Curso.Jornada)
		}
		if len(parts) > 0 {
			cursoStr = strings.Join(parts, " ")
		}
	}

	return &dto.CitaDetalleDTO{
		ID:             cita.ID,
		MatriculaID:    cita.MatriculaID,
		Entidad:        cita.Entidad,
		Motivo:         cita.Motivo,
		FechaCita:      cita.FechaCita,
		DiasAlerta:     cita.DiasAlerta,
		Completada:     cita.CitaCompletada,
		Curso:          cursoStr,
		Nombres:        nombres,
		Apellidos:      apellidos,
		NombreCompleto: nombreCompleto,
	}, nil
}

// =============================================================================
// ACTUALIZAR CITA
// =============================================================================
func (s *ManagementService) ActualizarCita(input dto.ActualizarCitaDTO) (*management.Convocatoria, error) {
	// 1. Validar que la fecha no sea en el pasado
	layout := "2006-01-02 15:04"
	fechaParsed, err := time.Parse(layout, input.FechaCita)
	if err == nil {
		if fechaParsed.Before(time.Now().Add(-5 * time.Minute)) {
			return nil, errors.New("no se puede agendar una cita en el pasado")
		}
	}

	// 2. Buscar cita existente
	var cita management.Convocatoria
	if err := s.db.First(&cita, input.ID).Error; err != nil {
		return nil, errors.New("cita no encontrada")
	}

	// 3. Actualizar campos editables
	cita.MatriculaID = input.MatriculaID
	cita.Entidad = input.Entidad
	cita.Motivo = input.Motivo
	cita.FechaCita = input.FechaCita
	cita.DiasAlerta = input.DiasAlerta

	if err := s.db.Save(&cita).Error; err != nil {
		return nil, fmt.Errorf("error al actualizar cita: %v", err)
	}

	return &cita, nil
}
