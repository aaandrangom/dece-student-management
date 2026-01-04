package services

import (
	"context"
	dto "dece/internal/application/dtos/notifications"
	"dece/internal/domain/management"
	"dece/internal/domain/notifications"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"
)

const (
	notifTipoResumenCitas = "resumen_alertas_citas"
)

// DEBUG: Descomenta la siguiente línea para agregar una hora de prueba personalizada.
// Formato: "HH:mm" (ej: "20:30", "15:45")
// Comenta o deja vacío ("") para desactivar en producción.
const testSlot = "21:48" // ← Cambia esta hora para tus pruebas

type NotificationsService struct {
	db  *gorm.DB
	ctx context.Context

	mu        sync.Mutex
	started   bool
	cancelCtx context.CancelFunc
}

func NewNotificationsService(db *gorm.DB) *NotificationsService {
	return &NotificationsService{db: db}
}

func (s *NotificationsService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *NotificationsService) StartScheduler() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.started {
		return
	}
	baseCtx := s.ctx
	if baseCtx == nil {
		baseCtx = context.Background()
	}
	ctx, cancel := context.WithCancel(baseCtx)
	s.cancelCtx = cancel
	s.started = true

	go s.schedulerLoop(ctx)
}

func (s *NotificationsService) StopScheduler() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.started {
		return
	}
	if s.cancelCtx != nil {
		s.cancelCtx()
	}
	s.started = false
}

func (s *NotificationsService) schedulerLoop(ctx context.Context) {
	slots := []string{"00:00", "07:00", "17:00"}

	// Agregar slot de prueba si está definido
	if testSlot != "" {
		slots = append(slots, testSlot)
	}

	for {
		nextTime, slot := nextScheduledRun(time.Now(), slots)
		wait := time.Until(nextTime)
		if wait < 0 {
			wait = 0
		}

		t := time.NewTimer(wait)
		select {
		case <-ctx.Done():
			if !t.Stop() {
				<-t.C
			}
			return
		case <-t.C:
			_, _ = s.GenerarResumenAlertasCitas("admin", slot, nextTime)
		}
	}
}

func nextScheduledRun(now time.Time, slots []string) (time.Time, string) {
	loc := now.Location()
	best := time.Time{}
	bestSlot := ""

	for _, s := range slots {
		parts := strings.Split(s, ":")
		if len(parts) != 2 {
			continue
		}
		h, errH := parseInt(parts[0])
		m, errM := parseInt(parts[1])
		if errH != nil || errM != nil {
			continue
		}

		candidate := time.Date(now.Year(), now.Month(), now.Day(), h, m, 0, 0, loc)
		if !candidate.After(now) {
			candidate = candidate.Add(24 * time.Hour)
		}

		if best.IsZero() || candidate.Before(best) {
			best = candidate
			bestSlot = s
		}
	}

	if best.IsZero() {
		// Fallback: 24h
		return now.Add(24 * time.Hour), ""
	}
	return best, bestSlot
}

func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}

// =============================================================================
// CRON: Generar un único resumen (agregado) de alertas de citas
// =============================================================================

func (s *NotificationsService) GenerarResumenAlertasCitas(rolDestino string, momento string, scheduledAt time.Time) (*notifications.Notificacion, error) {
	if strings.TrimSpace(rolDestino) == "" {
		rolDestino = "admin"
	}
	momento = strings.TrimSpace(momento)
	if momento == "" {
		return nil, errors.New("momento requerido (00:00|07:00|17:00)")
	}

	alertas, err := s.obtenerAlertasCitasActivasOrdenadas()
	if err != nil {
		return nil, err
	}
	if len(alertas) == 0 {
		return nil, nil
	}

	fechaProgramada := scheduledAt.Format("2006-01-02")

	// Construir metadata (cap para evitar payload enorme)
	items := make([]notifications.CitaAlertaItem, 0, min(len(alertas), 50))
	for _, a := range alertas {
		if len(items) >= 50 {
			break
		}
		items = append(items, a)
	}

	meta := notifications.NotificacionMetadata{Total: len(alertas), Items: items}

	titulo := fmt.Sprintf("%d alerta(s) de citas pendientes", len(alertas))

	// Construir mensaje con lista de todas las citas
	var mensajeBuilder strings.Builder
	fmt.Fprintf(&mensajeBuilder, "Resumen %s (%s)\n\n", fechaProgramada, momento)

	for i, cita := range items {
		fmt.Fprintf(&mensajeBuilder, "%d. %s • %s (%s) • %s\n",
			i+1,
			cita.FechaCita,
			cita.Estudiante,
			cita.Curso,
			cita.Entidad)
	}

	mensaje := mensajeBuilder.String()

	var existing notifications.Notificacion
	q := s.db.Where("tipo = ? AND rol_destino = ? AND fecha_programada = ? AND momento = ?", notifTipoResumenCitas, rolDestino, fechaProgramada, momento)
	err = q.First(&existing).Error

	// Si existe: actualizar y volver a marcar como no leída para que el admin se entere
	if err == nil {
		existing.Titulo = titulo
		existing.Mensaje = mensaje
		existing.Leida = false
		existing.Metadata.Data = meta
		if err := s.db.Save(&existing).Error; err != nil {
			return nil, err
		}
		return &existing, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	n := notifications.Notificacion{
		Tipo:            notifTipoResumenCitas,
		RolDestino:      rolDestino,
		FechaProgramada: fechaProgramada,
		Momento:         momento,
		Titulo:          titulo,
		Mensaje:         mensaje,
		Leida:           false,
	}
	n.Metadata.Data = meta

	if err := s.db.Create(&n).Error; err != nil {
		return nil, err
	}
	return &n, nil
}

func (s *NotificationsService) obtenerAlertasCitasActivasOrdenadas() ([]notifications.CitaAlertaItem, error) {
	var citas []management.Convocatoria

	// Ordenadas por fecha más cercana
	err := s.db.
		Preload("Matricula.Estudiante").
		Preload("Matricula.Curso.Nivel").
		Where("cita_completada = ?", false).
		Order("fecha_cita ASC").
		Find(&citas).Error
	if err != nil {
		return nil, err
	}

	layout := "2006-01-02 15:04"
	now := time.Now()
	activos := make([]notifications.CitaAlertaItem, 0)

	for _, c := range citas {
		fechaCita, err := time.Parse(layout, c.FechaCita)
		if err != nil {
			continue
		}

		fechaInicioAlerta := fechaCita.AddDate(0, 0, -c.DiasAlerta)
		if !now.After(fechaInicioAlerta) {
			continue
		}

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

		activos = append(activos, notifications.CitaAlertaItem{
			ConvocatoriaID: c.ID,
			FechaCita:      c.FechaCita,
			Entidad:        c.Entidad,
			Motivo:         c.Motivo,
			Estudiante:     nombreEst,
			Curso:          cursoStr,
		})
	}

	// Seguridad adicional: ordenar por fecha_cita asc por parse
	sort.SliceStable(activos, func(i, j int) bool {
		ti, errI := time.Parse(layout, activos[i].FechaCita)
		tj, errJ := time.Parse(layout, activos[j].FechaCita)
		if errI != nil || errJ != nil {
			return activos[i].FechaCita < activos[j].FechaCita
		}
		return ti.Before(tj)
	})

	return activos, nil
}

// =============================================================================
// API: Listar / Resumen / Marcar como leída
// =============================================================================

func (s *NotificationsService) ResumenNotificaciones(rolDestino string, limit int) (*dto.ResumenNotificacionesDTO, error) {
	if strings.TrimSpace(rolDestino) == "" {
		rolDestino = "admin"
	}
	if limit <= 0 || limit > 20 {
		limit = 10
	}

	var items []notifications.Notificacion
	if err := s.db.
		Where("rol_destino = ?", rolDestino).
		Order("fecha_creacion DESC").
		Limit(limit).
		Find(&items).Error; err != nil {
		return nil, err
	}

	var unreadCount int64
	if err := s.db.Model(&notifications.Notificacion{}).
		Where("rol_destino = ? AND leida = ?", rolDestino, false).
		Count(&unreadCount).Error; err != nil {
		return nil, err
	}

	mapped := make([]dto.NotificacionDTO, 0, len(items))
	for _, n := range items {
		mapped = append(mapped, mapNotificacionDTO(n))
	}

	return &dto.ResumenNotificacionesDTO{
		Items:       mapped,
		UnreadCount: int(unreadCount),
	}, nil
}

func (s *NotificationsService) ListarNotificacionesPaginadas(rolDestino string, page int, pageSize int) (*dto.NotificacionesPaginadasDTO, error) {
	if strings.TrimSpace(rolDestino) == "" {
		rolDestino = "admin"
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 50 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	var total int64
	if err := s.db.Model(&notifications.Notificacion{}).
		Where("rol_destino = ?", rolDestino).
		Count(&total).Error; err != nil {
		return nil, err
	}

	var rows []notifications.Notificacion
	if err := s.db.
		Where("rol_destino = ?", rolDestino).
		Order("fecha_creacion DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&rows).Error; err != nil {
		return nil, err
	}

	mapped := make([]dto.NotificacionDTO, 0, len(rows))
	for _, n := range rows {
		mapped = append(mapped, mapNotificacionDTO(n))
	}

	return &dto.NotificacionesPaginadasDTO{
		Items:    mapped,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *NotificationsService) MarcarNotificacionLeida(id uint) error {
	res := s.db.Model(&notifications.Notificacion{}).Where("id = ?", id).Update("leida", true)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("notificación no encontrada")
	}
	return nil
}

func mapNotificacionDTO(n notifications.Notificacion) dto.NotificacionDTO {
	return dto.NotificacionDTO{
		ID:              n.ID,
		Tipo:            n.Tipo,
		RolDestino:      n.RolDestino,
		FechaProgramada: n.FechaProgramada,
		Momento:         n.Momento,
		Titulo:          n.Titulo,
		Mensaje:         n.Mensaje,
		Leida:           n.Leida,
		FechaCreacion:   n.FechaCreacion.Format("2006-01-02 15:04"),
	}
}
