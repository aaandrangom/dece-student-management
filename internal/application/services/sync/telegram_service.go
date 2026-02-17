package sync

import (
	"bytes"
	"dece/internal/config"
	"dece/internal/domain/management"
	"encoding/json"
	"fmt"
	"io"
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

// --- Payloads ---

type SyncPayload struct {
	Estudiante       string `json:"estudiante"`
	Entidad          string `json:"entidad"`
	FechaCita        string `json:"fechaCita"`
	Motivo           string `json:"motivo"`
	DiasAnticipacion int    `json:"diasAnticipacion"`
}

type SyncUpdatePayload struct {
	ID               int    `json:"id"`
	Estudiante       string `json:"estudiante,omitempty"`
	Entidad          string `json:"entidad,omitempty"`
	FechaCita        string `json:"fechaCita,omitempty"`
	Motivo           string `json:"motivo,omitempty"`
	DiasAnticipacion *int   `json:"diasAnticipacion,omitempty"`
}

// SyncAPIResponse representa la respuesta de la API al crear alertas.
// Formato: {"success": true, "message": "...", "ids": [15, 16]}
type SyncAPIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	IDs     []int  `json:"ids"`
}

// --- Helpers HTTP ---

func (s *TelegramSyncService) getAPIConfig() (string, string, bool) {
	apiURL := config.AppConfig.TelegramAPIURL
	apiKey := config.AppConfig.TelegramAPIKey
	if apiURL == "" || apiKey == "" {
		return "", "", false
	}
	return apiURL, apiKey, true
}

func (s *TelegramSyncService) doRequest(method, url string, body []byte) (*http.Response, error) {
	_, apiKey, ok := s.getAPIConfig()
	if !ok {
		return nil, fmt.Errorf("API no configurada")
	}

	client := &http.Client{Timeout: 15 * time.Second}

	var req *http.Request
	var err error

	if body != nil {
		req, err = http.NewRequest(method, url, bytes.NewBuffer(body))
	} else {
		req, err = http.NewRequest(method, url, nil)
	}
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)

	return client.Do(req)
}

func isNetworkError(err error) bool {
	return err != nil
}

// --- Cola Offline ---

// LimpiarColaPorCita elimina todas las operaciones pendientes para una cita específica.
// Útil cuando se elimina una cita que nunca fue sincronizada (telegram_id=0).
func (s *TelegramSyncService) LimpiarColaPorCita(citaID uint) {
	result := s.db.Where("cita_id = ?", citaID).Delete(&management.SyncPendiente{})
	if result.RowsAffected > 0 {
		log.Printf("SyncQueue: Limpiadas %d operaciones pendientes para cita %d", result.RowsAffected, citaID)
	}
}

func (s *TelegramSyncService) encolarOperacion(operacion string, citaID uint, telegramID int, payload interface{}) {
	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("SyncQueue: Error serializando payload: %v", err)
		return
	}

	// Evitar duplicados: si ya existe un "create" para esta cita, actualizar el payload
	if operacion == "create" && citaID > 0 {
		var existente management.SyncPendiente
		if s.db.Where("operacion = ? AND cita_id = ?", "create", citaID).First(&existente).Error == nil {
			// Ya existe, actualizar el payload
			s.db.Model(&existente).Update("payload", string(jsonData))
			log.Printf("SyncQueue: Payload actualizado para create pendiente (cita %d)", citaID)
			return
		}
	}

	// Si es un "update" pero la cita nunca se sincronizó (hay un create pendiente),
	// simplemente actualizar el payload del create pendiente
	if operacion == "update" && citaID > 0 {
		var createPendiente management.SyncPendiente
		if s.db.Where("operacion = ? AND cita_id = ?", "create", citaID).First(&createPendiente).Error == nil {
			// El create pendiente ya tiene la data más reciente al enviarse
			log.Printf("SyncQueue: Update ignorado, create pendiente se enviará con datos actuales (cita %d)", citaID)
			return
		}
	}

	item := management.SyncPendiente{
		Operacion:  operacion,
		CitaID:     citaID,
		TelegramID: telegramID,
		Payload:    string(jsonData),
		CreadoEn:   time.Now().Format("2006-01-02 15:04:05"),
	}

	if err := s.db.Create(&item).Error; err != nil {
		log.Printf("SyncQueue: Error encolando operación '%s' para cita %d: %v", operacion, citaID, err)
	} else {
		log.Printf("SyncQueue: Operación '%s' encolada para cita %d (sin conexión)", operacion, citaID)
	}
}

// ProcesarColaPendiente intenta ejecutar todas las operaciones pendientes.
// Se ejecuta al inicio de la app y periódicamente.
func (s *TelegramSyncService) ProcesarColaPendiente() {
	apiURL, _, ok := s.getAPIConfig()
	if !ok {
		return
	}

	var pendientes []management.SyncPendiente
	s.db.Where("intentos < ?", 5).Order("id ASC").Find(&pendientes)

	if len(pendientes) == 0 {
		return
	}

	log.Printf("SyncQueue: Procesando %d operaciones pendientes...", len(pendientes))

	for _, item := range pendientes {
		var exito bool

		switch item.Operacion {
		case "create":
			exito = s.procesarCreatePendiente(apiURL, item)
		case "update":
			exito = s.procesarUpdatePendiente(apiURL, item)
		case "delete":
			exito = s.procesarDeletePendiente(apiURL, item)
		default:
			log.Printf("SyncQueue: Operación desconocida '%s', eliminando", item.Operacion)
			s.db.Delete(&item)
			continue
		}

		if exito {
			s.db.Delete(&item)
			log.Printf("SyncQueue: Operación '%s' (IDQueue: %d) procesada exitosamente", item.Operacion, item.ID)
		} else {
			s.db.Model(&item).Update("intentos", item.Intentos+1)
			log.Printf("SyncQueue: Operación '%s' (ID Queue: %d) falló, intento %d", item.Operacion, item.ID, item.Intentos+1)
		}
	}
}

func (s *TelegramSyncService) procesarCreatePendiente(apiURL string, item management.SyncPendiente) bool {
	// Si la cita ya no existe localmente (fue eliminada offline), saltar
	if item.CitaID > 0 {
		var cita management.Convocatoria
		if err := s.db.First(&cita, item.CitaID).Error; err != nil {
			log.Printf("SyncQueue Create: Cita %d ya no existe, saltando", item.CitaID)
			return true
		}
		// Si ya fue sincronizada por otro proceso, saltar
		if cita.TelegramSynced && cita.TelegramID > 0 {
			log.Printf("SyncQueue Create: Cita %d ya sincronizada (TelegramID: %d), saltando", item.CitaID, cita.TelegramID)
			return true
		}
		// Re-construir payload con datos frescos de la BD
		var citaFull management.Convocatoria
		s.db.Preload("Matricula.Estudiante").First(&citaFull, item.CitaID)
		nombreEst := "Desconocido"
		if citaFull.Matricula.ID != 0 && citaFull.Matricula.Estudiante.ID != 0 {
			nombreEst = fmt.Sprintf("%s %s", citaFull.Matricula.Estudiante.Nombres, citaFull.Matricula.Estudiante.Apellidos)
		}
		freshPayload := []SyncPayload{{
			Estudiante:       nombreEst,
			Entidad:          citaFull.Entidad,
			FechaCita:        citaFull.FechaCita,
			Motivo:           citaFull.Motivo,
			DiasAnticipacion: citaFull.DiasAlerta,
		}}
		freshJSON, err := json.Marshal(freshPayload)
		if err != nil {
			log.Printf("SyncQueue Create: Error serializando payload fresco: %v", err)
			return false
		}
		item.Payload = string(freshJSON)
	}

	resp, err := s.doRequest("POST", apiURL, []byte(item.Payload))
	if err != nil {
		log.Printf("SyncQueue Create: Error de red: %v", err)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		remoteIDs := s.extraerTelegramIDs(bodyBytes)
		if len(remoteIDs) > 0 && remoteIDs[0] > 0 && item.CitaID > 0 {
			s.db.Model(&management.Convocatoria{}).Where("id = ?", item.CitaID).
				Updates(map[string]interface{}{
					"telegram_synced": true,
					"telegram_id":     remoteIDs[0],
				})
		} else if item.CitaID > 0 {
			s.db.Model(&management.Convocatoria{}).Where("id = ?", item.CitaID).
				Update("telegram_synced", true)
		}
		return true
	}

	log.Printf("SyncQueue Create: Status %d", resp.StatusCode)
	return false
}

func (s *TelegramSyncService) procesarUpdatePendiente(apiURL string, item management.SyncPendiente) bool {
	resp, err := s.doRequest("PUT", apiURL, []byte(item.Payload))
	if err != nil {
		log.Printf("SyncQueue Update: Error de red: %v", err)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return true
	}
	log.Printf("SyncQueue Update: Status %d", resp.StatusCode)
	return false
}

func (s *TelegramSyncService) procesarDeletePendiente(apiURL string, item management.SyncPendiente) bool {
	resp, err := s.doRequest("DELETE", apiURL, []byte(item.Payload))
	if err != nil {
		log.Printf("SyncQueue Delete: Error de red: %v", err)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return true
	}
	log.Printf("SyncQueue Delete: Status %d", resp.StatusCode)
	return false
}

// extraerTelegramIDs extrae los IDs remotos de la respuesta de la API.
// Formato esperado: {"success": true, "ids": [15, 16, 17]}
func (s *TelegramSyncService) extraerTelegramIDs(body []byte) []int {
	var response SyncAPIResponse
	if err := json.Unmarshal(body, &response); err == nil && len(response.IDs) > 0 {
		return response.IDs
	}
	return nil
}

// --- Operación POST: Crear alertas ---

// SyncConvocatorias sincroniza TODAS las citas no sincronizadas (batch).
// Se ejecuta al inicio de la app.
func (s *TelegramSyncService) SyncConvocatorias() {
	apiURL, _, ok := s.getAPIConfig()
	if !ok {
		log.Println("Sync: API URL o Key no configurados.")
		return
	}

	var citas []management.Convocatoria
	now := time.Now().Format("2006-01-02 15:04")

	err := s.db.Preload("Matricula.Estudiante").
		Where("fecha_cita >= ?", now).
		Where("cita_completada = ?", false).
		Where("telegram_synced = ?", false).
		Order("fecha_cita ASC").
		Find(&citas).Error

	if err != nil {
		log.Printf("Error obteniendo citas para sync: %v\n", err)
		return
	}

	if len(citas) == 0 {
		log.Println("Sync: No hay citas pendientes para sincronizar.")
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

	resp, err := s.doRequest("POST", apiURL, jsonData)
	if err != nil {
		log.Printf("Error ejecutando sync a Telegram API: %v\n", err)
		// Encolar todas las citas como operaciones pendientes
		for _, c := range citas {
			nombreEst := "Desconocido"
			if c.Matricula.ID != 0 && c.Matricula.Estudiante.ID != 0 {
				nombreEst = fmt.Sprintf("%s %s", c.Matricula.Estudiante.Nombres, c.Matricula.Estudiante.Apellidos)
			}
			p := []SyncPayload{{
				Estudiante:       nombreEst,
				Entidad:          c.Entidad,
				FechaCita:        c.FechaCita,
				Motivo:           c.Motivo,
				DiasAnticipacion: c.DiasAlerta,
			}}
			s.encolarOperacion("create", c.ID, 0, p)
		}
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Println("Sync: Sincronización con Telegram exitosa")

		// Extraer IDs de la respuesta: {"success": true, "ids": [15, 16]}
		bodyBytes, _ := io.ReadAll(resp.Body)
		remoteIDs := s.extraerTelegramIDs(bodyBytes)

		for i, c := range citas {
			updates := map[string]interface{}{
				"telegram_synced": true,
			}
			if i < len(remoteIDs) && remoteIDs[i] > 0 {
				updates["telegram_id"] = remoteIDs[i]
			}
			s.db.Model(&management.Convocatoria{}).Where("id = ?", c.ID).Updates(updates)
		}
	} else {
		log.Printf("Sync: Falló con status: %d\n", resp.StatusCode)
	}
}

// SyncNuevaCita envía una cita individual recién creada (POST).
func (s *TelegramSyncService) SyncNuevaCita(citaID uint) {
	apiURL, _, ok := s.getAPIConfig()
	if !ok {
		return
	}

	var cita management.Convocatoria
	err := s.db.Preload("Matricula.Estudiante").First(&cita, citaID).Error
	if err != nil {
		log.Printf("SyncNuevaCita: Error buscando cita %d: %v", citaID, err)
		return
	}

	if cita.TelegramSynced {
		log.Printf("SyncNuevaCita: La cita %d ya está sincronizada", citaID)
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

	resp, err := s.doRequest("POST", apiURL, jsonData)
	if err != nil {
		log.Printf("SyncNuevaCita: Sin conexión, encolando operación: %v", err)
		s.encolarOperacion("create", citaID, 0, payload)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("SyncNuevaCita: Enviado correctamente (ID: %d)", citaID)

		// Extraer IDs: {"success": true, "ids": [15]}
		bodyBytes, _ := io.ReadAll(resp.Body)
		remoteIDs := s.extraerTelegramIDs(bodyBytes)

		updates := map[string]interface{}{
			"telegram_synced": true,
		}
		if len(remoteIDs) > 0 && remoteIDs[0] > 0 {
			updates["telegram_id"] = remoteIDs[0]
		}
		s.db.Model(&management.Convocatoria{}).Where("id = ?", citaID).Updates(updates)
	} else {
		log.Printf("SyncNuevaCita: Fallo al enviar (ID: %d, Status: %d)", citaID, resp.StatusCode)
	}
}

// --- Operación PUT: Actualizar alertas ---

// SyncActualizarCita envía una actualización al endpoint PUT /sync.
func (s *TelegramSyncService) SyncActualizarCita(citaID uint) {
	apiURL, _, ok := s.getAPIConfig()
	if !ok {
		return
	}

	var cita management.Convocatoria
	err := s.db.Preload("Matricula.Estudiante").First(&cita, citaID).Error
	if err != nil {
		log.Printf("SyncActualizarCita: Error buscando cita %d: %v", citaID, err)
		return
	}

	// Si no tiene TelegramID, no se puede actualizar en la API remota.
	// Pero si ya fue sincronizada, intentamos de todos modos.
	if cita.TelegramID == 0 {
		if !cita.TelegramSynced {
			log.Printf("SyncActualizarCita: Cita %d nunca fue sincronizada, encolando como create", citaID)
			// Si nunca se sincronizó, crear en vez de actualizar
			go s.SyncNuevaCita(citaID)
			return
		}
		log.Printf("SyncActualizarCita: Cita %d sincronizada pero sin TelegramID, no se puede actualizar remotamente", citaID)
		return
	}

	nombreEst := "Desconocido"
	if cita.Matricula.ID != 0 && cita.Matricula.Estudiante.ID != 0 {
		nombreEst = fmt.Sprintf("%s %s", cita.Matricula.Estudiante.Nombres, cita.Matricula.Estudiante.Apellidos)
	}

	diasAlerta := cita.DiasAlerta
	payload := SyncUpdatePayload{
		ID:               cita.TelegramID,
		Estudiante:       nombreEst,
		Entidad:          cita.Entidad,
		FechaCita:        cita.FechaCita,
		Motivo:           cita.Motivo,
		DiasAnticipacion: &diasAlerta,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("SyncActualizarCita: Error marshalling payload: %v", err)
		return
	}

	resp, err := s.doRequest("PUT", apiURL, jsonData)
	if err != nil {
		log.Printf("SyncActualizarCita: Sin conexión, encolando: %v", err)
		s.encolarOperacion("update", citaID, cita.TelegramID, payload)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("SyncActualizarCita: Actualizado correctamente (Local ID: %d, Telegram ID: %d)", citaID, cita.TelegramID)
	} else {
		log.Printf("SyncActualizarCita: Fallo (Local ID: %d, Status: %d)", citaID, resp.StatusCode)
	}
}

// --- Operación DELETE: Eliminar alertas ---

// SyncEliminarCita envía una eliminación al endpoint DELETE /sync.
func (s *TelegramSyncService) SyncEliminarCita(telegramID int) {
	apiURL, _, ok := s.getAPIConfig()
	if !ok {
		return
	}

	if telegramID == 0 {
		log.Println("SyncEliminarCita: No hay TelegramID, no se puede eliminar remotamente")
		return
	}

	// El body debe ser un array de IDs: [37]
	deletePayload := []int{telegramID}
	jsonData, err := json.Marshal(deletePayload)
	if err != nil {
		log.Printf("SyncEliminarCita: Error marshalling payload: %v", err)
		return
	}

	resp, err := s.doRequest("DELETE", apiURL, jsonData)
	if err != nil {
		log.Printf("SyncEliminarCita: Sin conexión, encolando: %v", err)
		s.encolarOperacion("delete", 0, telegramID, deletePayload)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		log.Printf("SyncEliminarCita: Eliminado correctamente (Telegram ID: %d)", telegramID)
	} else {
		log.Printf("SyncEliminarCita: Fallo (Telegram ID: %d, Status: %d)", telegramID, resp.StatusCode)
	}
}

// --- Sincronización completa al inicio ---

// SyncCompleta se ejecuta al inicio de la app:
// 1. Procesa la cola de operaciones pendientes
// 2. Sincroniza citas nuevas no sincronizadas
func (s *TelegramSyncService) SyncCompleta() {
	log.Println("Sync: Iniciando sincronización completa...")

	// Primero: procesar cola de operaciones pendientes (offline)
	s.ProcesarColaPendiente()

	// Segundo: sincronizar citas nuevas (POST batch)
	s.SyncConvocatorias()

	log.Println("Sync: Sincronización completa finalizada.")
}
