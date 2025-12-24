package welfare

import (
	"dece/internal/domain/welfare"
	"time"

	"gorm.io/gorm"
)

type AgendaService struct {
	db *gorm.DB
}

func NewAgendaService(db *gorm.DB) *AgendaService {
	return &AgendaService{db: db}
}

type CitaDTO struct {
	ID                 uint      `json:"id"`
	HistorialID        uint      `json:"historial_id"`
	FechaCita          time.Time `json:"fecha_cita"`
	Motivo             string    `json:"motivo"`
	EntidadDestino     string    `json:"entidad_destino"`
	NotificarDiasAntes int       `json:"notificar_dias_antes"`
	Visto              bool      `json:"visto"`
	Estado             string    `json:"estado"`
}

func (s *AgendaService) SaveCita(dto CitaDTO) error {
	cita := welfare.Cita{
		ID:                 dto.ID,
		HistorialID:        dto.HistorialID,
		FechaCita:          dto.FechaCita,
		Motivo:             dto.Motivo,
		EntidadDestino:     dto.EntidadDestino,
		NotificarDiasAntes: dto.NotificarDiasAntes,
		Visto:              dto.Visto,
		Estado:             dto.Estado,
	}
	return s.db.Save(&cita).Error
}

func (s *AgendaService) GetCitasProximas() ([]CitaDTO, error) {
	var citas []welfare.Cita
	now := time.Now()

	// Logic:
	// 1. Appointments in the future (FechaCita >= Now)
	// 2. AND (
	//      (FechaCita <= Now + 7 days) -- Coming up this week
	//      OR
	//      (date(FechaCita) - NotificarDiasAntes <= date(Now)) -- Alert triggered
	//    )

	// SQLite specific date function usage
	err := s.db.Where("fecha_cita >= ? AND (fecha_cita <= ? OR date(fecha_cita, '-' || notificar_dias_antes || ' days') <= date(?))", now, now.AddDate(0, 0, 7), now).
		Order("fecha_cita asc").
		Find(&citas).Error

	if err != nil {
		return nil, err
	}

	var dtos []CitaDTO
	for _, c := range citas {
		dtos = append(dtos, CitaDTO{
			ID:                 c.ID,
			HistorialID:        c.HistorialID,
			FechaCita:          c.FechaCita,
			Motivo:             c.Motivo,
			EntidadDestino:     c.EntidadDestino,
			NotificarDiasAntes: c.NotificarDiasAntes,
			Visto:              c.Visto,
			Estado:             c.Estado,
		})
	}
	return dtos, nil
}

func (s *AgendaService) GetAllCitas() ([]CitaDTO, error) {
	var citas []welfare.Cita
	err := s.db.Order("fecha_cita asc").Find(&citas).Error
	if err != nil {
		return nil, err
	}

	var dtos []CitaDTO
	for _, c := range citas {
		dtos = append(dtos, CitaDTO{
			ID:                 c.ID,
			HistorialID:        c.HistorialID,
			FechaCita:          c.FechaCita,
			Motivo:             c.Motivo,
			EntidadDestino:     c.EntidadDestino,
			NotificarDiasAntes: c.NotificarDiasAntes,
			Visto:              c.Visto,
			Estado:             c.Estado,
		})
	}
	return dtos, nil
}

func (s *AgendaService) DeleteCita(id uint) error {
	return s.db.Delete(&welfare.Cita{}, id).Error
}
