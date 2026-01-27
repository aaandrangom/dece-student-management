package sync

import (
	"bytes"
	"dece/internal/config"
	"dece/internal/domain/management"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"gorm.io/gorm"
)

type TelegramSyncService struct {
	db *gorm.DB
}

func NewTelegramSyncService(db *gorm.DB) *TelegramSyncService {
	return &TelegramSyncService{db: db}
}

type SyncPayload struct {
	Estudiante       string `json:"estudiante"`
	Entidad          string `json:"entidad"`
	FechaCita        string `json:"fechaCita"`
	Motivo           string `json:"motivo"`
	DiasAnticipacion int    `json:"diasAnticipacion"`
}

func (s *TelegramSyncService) SyncConvocatorias() {
	apiURL := config.AppConfig.TelegramAPIURL
	apiKey := config.AppConfig.TelegramAPIKey

	if apiURL == "" || apiKey == "" {
		return
	}

	var citas []management.Convocatoria
	now := time.Now().Format("2006-01-02 15:04")

	err := s.db.Preload("Matricula.Estudiante").
		Where("fecha_cita >= ?", now).
		Where("cita_completada = ?", false).
		Order("fecha_cita ASC").
		Find(&citas).Error

	if err != nil {
		log.Printf("Error obteniendo citas para sync: %v\n", err)
		return
	}

	payload := make([]SyncPayload, 0)
	for _, c := range citas {
		nombreEst := "Desconocido"
		if c.Matricula.ID != 0 && c.Matricula.Estudiante.ID != 0 {
			nombreEst = fmt.Sprintf("%s %s", c.Matricula.Estudiante.Nombres, c.Matricula.Estudiante.Apellidos)
		}

		payload = append(payload, SyncPayload{
			Estudiante:       nombreEst,
			Entidad:          c.Entidad,
			FechaCita:        c.FechaCita,
			Motivo:           c.Motivo,
			DiasAnticipacion: c.DiasAlerta,
		})
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshalling sync payload: %v\n", err)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error creando request sync: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error ejecutando sync a Telegram API: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Println("Sync: Sincronización con Telegram exitosa")
	} else {
		log.Printf("Sync: Falló con status: %d\n", resp.StatusCode)
	}
}

func (s *TelegramSyncService) SyncNuevaCita(citaID uint) {
	apiURL := config.AppConfig.TelegramAPIURL
	apiKey := config.AppConfig.TelegramAPIKey

	if apiURL == "" || apiKey == "" {
		return
	}

	var cita management.Convocatoria
	err := s.db.Preload("Matricula.Estudiante").First(&cita, citaID).Error
	if err != nil {
		log.Printf("SyncNuevaCita: Error buscando cita %d: %v", citaID, err)
		return
	}

	nombreEst := "Desconocido"
	if cita.Matricula.ID != 0 && cita.Matricula.Estudiante.ID != 0 {
		nombreEst = fmt.Sprintf("%s %s", cita.Matricula.Estudiante.Nombres, cita.Matricula.Estudiante.Apellidos)
	}

	payload := []SyncPayload{
		{
			Estudiante:       nombreEst,
			Entidad:          cita.Entidad,
			FechaCita:        cita.FechaCita,
			Motivo:           cita.Motivo,
			DiasAnticipacion: cita.DiasAlerta,
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("SyncNuevaCita: Error marshalling payload: %v", err)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("SyncNuevaCita: Error creando request: %v", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("SyncNuevaCita: Error enviando request: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("SyncNuevaCita: Enviado correctamente (ID: %d)", citaID)
	} else {
		log.Printf("SyncNuevaCita: Fallo al enviar (ID: %d, Status: %d)", citaID, resp.StatusCode)
	}
}
