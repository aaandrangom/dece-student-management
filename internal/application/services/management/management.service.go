package services

import (
	"context"
	dto "dece/internal/application/dtos/management"
	"dece/internal/application/services/sync"
	"dece/internal/domain/academic"
	"dece/internal/domain/common"
	"dece/internal/domain/faculty"
	"dece/internal/domain/management"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"
)

type ManagementService struct {
	db   *gorm.DB
	ctx  context.Context
	sync *sync.TelegramSyncService
}

func NewManagementService(db *gorm.DB, sync *sync.TelegramSyncService) *ManagementService {
	return &ManagementService{db: db, sync: sync}
}

func (s *ManagementService) Startup(ctx context.Context) {
	s.ctx = ctx
}

func (s *ManagementService) AgendarCita(input dto.AgendarCitaDTO) (*management.Convocatoria, error) {
	layout := "2006-01-02 15:04"
	fechaParsed, err := time.Parse(layout, input.FechaCita)

	if err == nil {
		if fechaParsed.Before(time.Now().Add(-5 * time.Minute)) {
			return nil, errors.New("No se puede agendar una cita en el pasado")
		}
	}

	cita := management.Convocatoria{
		MatriculaID:    input.MatriculaID,
		Entidad:        input.Entidad,
		Motivo:         input.Motivo,
		FechaCita:      input.FechaCita,
		DiasAlerta:     input.DiasAlerta,
		CitaCompletada: false,
	}

	if err := s.db.Create(&cita).Error; err != nil {
		return nil, fmt.Errorf("Error al agendar cita: %v", err)
	}

	// Sincronizar en segundo plano
	if s.sync != nil {
		go s.sync.SyncConvocatorias()
	}

	return &cita, nil
}

func (s *ManagementService) ListarCitas(filtro dto.FiltroCitasDTO) ([]dto.CitaResumenDTO, error) {
	var citas []management.Convocatoria

	query := s.db.Model(&management.Convocatoria{}).
		Preload("Matricula.Estudiante").
		Preload("Matricula.Curso.Nivel").
		Order("fecha_cita ASC")

	if filtro.Tipo == "pendientes" {
		query = query.Where("cita_completada = ?", false)
	} else if filtro.Tipo == "rango" && filtro.FechaSolo != "" {
		query = query.Where("fecha_cita LIKE ?", filtro.FechaSolo+"%")
	}

	if err := query.Find(&citas).Error; err != nil {
		return nil, err
	}

	response := make([]dto.CitaResumenDTO, len(citas))
	layout := "2006-01-02 15:04"
	now := time.Now()

	for i, c := range citas {
		nombreEst := "Desconocido"
		cursoStr := "S/C"
		if c.Matricula.ID != 0 {
			if c.Matricula.Estudiante.ID != 0 {
				nombreEst = fmt.Sprintf("%s %s", c.Matricula.Estudiante.Apellidos, c.Matricula.Estudiante.Nombres)
			}

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

		esAlerta := false
		if !c.CitaCompletada {
			fechaCita, _ := time.Parse(layout, c.FechaCita)
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

func (s *ManagementService) MarcarCompletada(id uint, completada bool) error {
	result := s.db.Model(&management.Convocatoria{}).
		Where("id = ?", id).
		Update("cita_completada", completada)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("Cita no encontrada")
	}
	return nil
}

func (s *ManagementService) EliminarCita(id uint) error {
	return s.db.Delete(&management.Convocatoria{}, id).Error
}

func (s *ManagementService) ObtenerCita(id uint) (*dto.CitaDetalleDTO, error) {
	var cita management.Convocatoria

	if err := s.db.
		Preload("Matricula.Estudiante").
		Preload("Matricula.Curso.Nivel").
		First(&cita, id).Error; err != nil {
		return nil, errors.New("Cita no encontrada")
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

func (s *ManagementService) ActualizarCita(input dto.ActualizarCitaDTO) (*management.Convocatoria, error) {
	layout := "2006-01-02 15:04"
	fechaParsed, err := time.Parse(layout, input.FechaCita)
	if err == nil {
		if fechaParsed.Before(time.Now().Add(-5 * time.Minute)) {
			return nil, errors.New("No se puede agendar una cita en el pasado")
		}
	}

	var cita management.Convocatoria
	if err := s.db.First(&cita, input.ID).Error; err != nil {
		return nil, errors.New("Cita no encontrada")
	}

	cita.MatriculaID = input.MatriculaID
	cita.Entidad = input.Entidad
	cita.Motivo = input.Motivo
	cita.FechaCita = input.FechaCita
	cita.DiasAlerta = input.DiasAlerta

	if err := s.db.Save(&cita).Error; err != nil {
		return nil, fmt.Errorf("Error al actualizar cita: %v", err)
	}

	return &cita, nil
}

func (s *ManagementService) ListarCapacitaciones() ([]dto.CapacitacionResumenDTO, error) {
	var capacitaciones []management.Capacitacion

	var periodoActivo academic.PeriodoLectivo
	if err := s.db.Where("es_activo = ?", true).First(&periodoActivo).Error; err != nil {
		return []dto.CapacitacionResumenDTO{}, nil
	}

	result := s.db.Where("periodo_id = ?", periodoActivo.ID).
		Order("fecha DESC").
		Find(&capacitaciones)

	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]dto.CapacitacionResumenDTO, len(capacitaciones))
	for i, c := range capacitaciones {
		detalles := c.DetalleAudiencia.Data

		response[i] = dto.CapacitacionResumenDTO{
			ID:                    c.ID,
			Fecha:                 c.Fecha,
			Tema:                  c.Tema,
			GrupoObjetivo:         detalles.GrupoObjetivo,
			CantidadBeneficiarios: detalles.CantidadBeneficiarios,
			TieneEvidencia:        c.RutaEvidencia != "",
			RutaEvidencia:         c.RutaEvidencia,
		}
	}

	return response, nil
}

func (s *ManagementService) ObtenerCapacitacion(id uint) (*dto.GuardarCapacitacionDTO, error) {
	var c management.Capacitacion
	if err := s.db.First(&c, id).Error; err != nil {
		return nil, errors.New("Capacitación no encontrada")
	}

	detalles := c.DetalleAudiencia.Data

	return &dto.GuardarCapacitacionDTO{
		ID:                    c.ID,
		Tema:                  c.Tema,
		Fecha:                 c.Fecha,
		GrupoObjetivo:         detalles.GrupoObjetivo,
		JornadaDocentes:       detalles.JornadaDocentes,
		CursoID:               detalles.CursoID,
		GradoEspecifico:       detalles.GradoEspecifico,
		ParaleloEspecifico:    detalles.ParaleloEspecifico,
		CantidadBeneficiarios: detalles.CantidadBeneficiarios,
	}, nil
}

func (s *ManagementService) RegistrarCapacitacion(input dto.GuardarCapacitacionDTO) (*management.Capacitacion, error) {
	var capacitacion management.Capacitacion
	var rutaEvidenciaPrevia string

	var periodoActivo academic.PeriodoLectivo
	if err := s.db.Where("es_activo = ?", true).First(&periodoActivo).Error; err != nil {
		return nil, errors.New("Debe configurar un periodo lectivo activo antes de registrar capacitaciones")
	}

	var cursoSeleccionado faculty.Curso
	if input.CursoID > 0 {
		if err := s.db.Preload("Nivel").
			Where("id = ? AND periodo_id = ?", input.CursoID, periodoActivo.ID).
			First(&cursoSeleccionado).Error; err != nil {
			return nil, errors.New("El aula seleccionada no pertenece al periodo lectivo activo")
		}
	}

	audiencia := management.AudienciaCapacitacion{
		GrupoObjetivo:         input.GrupoObjetivo,
		JornadaDocentes:       input.JornadaDocentes,
		CursoID:               input.CursoID,
		GradoEspecifico:       input.GradoEspecifico,
		ParaleloEspecifico:    input.ParaleloEspecifico,
		CantidadBeneficiarios: input.CantidadBeneficiarios,
	}

	if input.CursoID > 0 {
		nivel := strings.TrimSpace(cursoSeleccionado.Nivel.NombreCompleto)
		if nivel == "" {
			nivel = strings.TrimSpace(cursoSeleccionado.Nivel.Nombre)
		}
		audiencia.GradoEspecifico = nivel
		paralelo := strings.TrimSpace(cursoSeleccionado.Paralelo)
		jornada := strings.TrimSpace(cursoSeleccionado.Jornada)
		suffix := strings.TrimSpace(strings.Join([]string{paralelo, jornada}, " "))
		audiencia.ParaleloEspecifico = suffix
	}

	if input.ID > 0 {
		if err := s.db.First(&capacitacion, input.ID).Error; err != nil {
			return nil, errors.New("Registro no encontrado para editar")
		}
		rutaEvidenciaPrevia = capacitacion.RutaEvidencia
	} else {
		capacitacion.PeriodoID = periodoActivo.ID
		capacitacion.RutaEvidencia = ""
	}

	capacitacion.Tema = input.Tema
	capacitacion.Fecha = strings.Replace(input.Fecha, "T", " ", 1)

	capacitacion.DetalleAudiencia = common.JSONMap[management.AudienciaCapacitacion]{
		Data: audiencia,
	}

	if input.ID > 0 {
		capacitacion.RutaEvidencia = rutaEvidenciaPrevia
	}

	if err := s.db.Save(&capacitacion).Error; err != nil {
		return nil, fmt.Errorf("Error al guardar capacitación: %v", err)
	}

	return &capacitacion, nil
}

func (s *ManagementService) ListarAulasPeriodoActivo() ([]dto.AulaDTO, error) {
	var periodoActivo academic.PeriodoLectivo
	if err := s.db.Where("es_activo = ?", true).First(&periodoActivo).Error; err != nil {
		return []dto.AulaDTO{}, nil
	}

	var cursos []faculty.Curso
	if err := s.db.
		Preload("Nivel").
		Where("periodo_id = ?", periodoActivo.ID).
		Order("nivel_id ASC, paralelo ASC, jornada ASC").
		Find(&cursos).Error; err != nil {
		return nil, err
	}

	resp := make([]dto.AulaDTO, 0, len(cursos))
	for _, c := range cursos {
		nivel := strings.TrimSpace(c.Nivel.NombreCompleto)
		if nivel == "" {
			nivel = strings.TrimSpace(c.Nivel.Nombre)
		}
		parts := make([]string, 0, 3)
		if nivel != "" {
			parts = append(parts, nivel)
		}
		if strings.TrimSpace(c.Paralelo) != "" {
			parts = append(parts, c.Paralelo)
		}
		if strings.TrimSpace(c.Jornada) != "" {
			parts = append(parts, c.Jornada)
		}
		nombre := strings.Join(parts, " ")
		resp = append(resp, dto.AulaDTO{ID: c.ID, Nombre: nombre})
	}

	return resp, nil
}

func (s *ManagementService) SubirEvidenciaCapacitacion(id uint, rutaOrigen string) (string, error) {
	var cap management.Capacitacion

	if err := s.db.First(&cap, id).Error; err != nil {
		return "", errors.New("Capacitación no encontrada")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("Error al acceder al sistema de archivos")
	}
	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Trainings")
	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error al crear carpeta: %v", err)
	}

	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".jpg"
	}

	nuevoNombre := fmt.Sprintf("TALLER_%d_%d%s", cap.ID, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	src, err := os.Open(rutaOrigen)
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(rutaDestinoCompleta)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	if cap.RutaEvidencia != "" {
		if _, err := os.Stat(cap.RutaEvidencia); err == nil {
			os.Remove(cap.RutaEvidencia)
		}
	}

	if err := s.db.Model(&cap).Update("ruta_evidencia", rutaDestinoCompleta).Error; err != nil {
		return "", fmt.Errorf("Archivo guardado pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *ManagementService) EliminarCapacitacion(id uint) error {
	var cap management.Capacitacion
	if err := s.db.First(&cap, id).Error; err == nil {
		if cap.RutaEvidencia != "" {
			os.Remove(cap.RutaEvidencia)
		}
	}
	return s.db.Delete(&management.Capacitacion{}, id).Error
}

func (s *ManagementService) VerificarAlertas() ([]dto.AlertaDashboardDTO, error) {
	var citas []management.Convocatoria
	var alertas []dto.AlertaDashboardDTO

	err := s.db.Preload("Matricula.Estudiante").
		Preload("Matricula.Curso.Nivel").
		Where("cita_completada = ?", false).
		Find(&citas).Error

	if err != nil {
		return nil, err
	}

	layout := "2006-01-02 15:04"
	ahora := time.Now()

	for _, c := range citas {
		fechaCita, err := time.Parse(layout, c.FechaCita)
		if err != nil {
			continue
		}

		fechaInicioAlerta := fechaCita.AddDate(0, 0, -c.DiasAlerta)

		esAlertaActiva := ahora.After(fechaInicioAlerta)

		if esAlertaActiva {
			diasRestantes := int(time.Until(fechaCita).Hours() / 24)
			nombreEst := "Desconocido"
			cursoEst := "S/C"

			if c.Matricula.ID != 0 {
				if c.Matricula.Estudiante.ID != 0 {
					nombreEst = fmt.Sprintf("%s %s", c.Matricula.Estudiante.Apellidos, c.Matricula.Estudiante.Nombres)
				}

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
					cursoEst = strings.Join(parts, " ")
				}
			}

			nivel := "Media"
			color := "blue"

			if diasRestantes < 0 {
				nivel = "Atrasada"
				color = "red"
			} else if diasRestantes <= 1 {
				nivel = "Alta"
				color = "orange"
			}

			alertas = append(alertas, dto.AlertaDashboardDTO{
				ID:            c.ID,
				Titulo:        fmt.Sprintf("Cita: %s", c.Entidad),
				Descripcion:   fmt.Sprintf("%s (%s)", nombreEst, cursoEst),
				FechaHora:     c.FechaCita,
				DiasRestantes: diasRestantes,
				NivelUrgencia: nivel,
				Color:         color,
			})
		}
	}

	return alertas, nil
}
