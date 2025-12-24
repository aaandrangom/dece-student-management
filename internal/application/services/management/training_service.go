package management

import (
	"dece/internal/domain/management"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"
)

type TrainingService struct {
	db *gorm.DB
}

func NewTrainingService(db *gorm.DB) *TrainingService {
	return &TrainingService{db: db}
}

type TrainingDTO struct {
	ID                   uint      `json:"id"`
	AnioLectivoID        uint      `json:"anio_lectivo_id"`
	Tema                 string    `json:"tema"`
	Fecha                time.Time `json:"fecha"`
	PublicoObjetivo      string    `json:"publico_objetivo"`
	AsistentesCount      int       `json:"asistentes_count"`
	ArchivoEvidenciaPath string    `json:"archivo_evidencia_path"`
}

func (s *TrainingService) GetTrainings() ([]TrainingDTO, error) {
	var trainings []management.Capacitacion
	err := s.db.Order("fecha desc").Find(&trainings).Error
	if err != nil {
		return nil, err
	}

	var dtos []TrainingDTO
	for _, t := range trainings {
		dtos = append(dtos, TrainingDTO{
			ID:                   t.ID,
			AnioLectivoID:        t.AnioLectivoID,
			Tema:                 t.Tema,
			Fecha:                t.Fecha,
			PublicoObjetivo:      t.PublicoObjetivo,
			AsistentesCount:      t.AsistentesCount,
			ArchivoEvidenciaPath: t.ArchivoEvidenciaPath,
		})
	}
	return dtos, nil
}

func (s *TrainingService) SaveTraining(dto TrainingDTO) error {
	training := management.Capacitacion{
		ID:                   dto.ID,
		AnioLectivoID:        dto.AnioLectivoID,
		Tema:                 dto.Tema,
		Fecha:                dto.Fecha,
		PublicoObjetivo:      dto.PublicoObjetivo,
		AsistentesCount:      dto.AsistentesCount,
		ArchivoEvidenciaPath: dto.ArchivoEvidenciaPath,
	}
	return s.db.Save(&training).Error
}

func (s *TrainingService) DeleteTraining(id uint) error {
	return s.db.Delete(&management.Capacitacion{}, id).Error
}

func (s *TrainingService) UploadEvidence(id uint, base64File string) error {
	parts := strings.Split(base64File, ",")
	if len(parts) != 2 {
		return fmt.Errorf("formato de archivo inválido")
	}
	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return err
	}

	uploadDir := filepath.Join("uploads", "trainings")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return err
	}

	filename := fmt.Sprintf("evidence_%d_%d.pdf", id, time.Now().Unix())
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return err
	}

	return s.db.Model(&management.Capacitacion{}).Where("id = ?", id).Update("archivo_evidencia_path", filePath).Error
}

func (s *TrainingService) GetEvidence(id uint) (string, error) {
	var training management.Capacitacion
	if err := s.db.First(&training, id).Error; err != nil {
		return "", err
	}

	if training.ArchivoEvidenciaPath == "" {
		return "", nil
	}

	data, err := os.ReadFile(training.ArchivoEvidenciaPath)
	if err != nil {
		return "", err
	}

	mimeType := "application/pdf"
	if !strings.HasSuffix(training.ArchivoEvidenciaPath, ".pdf") {
		mimeType = "image/jpeg" // Fallback
	}

	base64Str := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64Str), nil
}
