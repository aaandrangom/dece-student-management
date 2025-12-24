package institution

import (
	"dece/internal/domain/institution"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"
)

type InstitutionService struct {
	db *gorm.DB
}

func NewInstitutionService(db *gorm.DB) *InstitutionService {
	return &InstitutionService{db: db}
}

func (s *InstitutionService) GetInstitution() (*institution.Institucion, error) {
	var inst institution.Institucion
	// Always fetch the first record
	result := s.db.First(&inst)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return &institution.Institucion{}, nil
		}
		return nil, result.Error
	}
	return &inst, nil
}

func (s *InstitutionService) SaveInstitution(inst institution.Institucion) error {
	// Check if record exists to ensure we update the singleton
	var existing institution.Institucion
	result := s.db.First(&existing)

	if result.Error == nil {
		inst.ID = existing.ID // Force update of existing record
	}

	return s.db.Save(&inst).Error
}

func (s *InstitutionService) UploadLogo(base64File string) (string, error) {
	parts := strings.Split(base64File, ",")
	if len(parts) != 2 {
		return "", fmt.Errorf("formato de archivo inválido")
	}
	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", err
	}

	uploadDir := filepath.Join("uploads", "institution")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", err
	}

	filename := fmt.Sprintf("logo_%d.png", time.Now().Unix())
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return "", err
	}

	// Update database
	var inst institution.Institucion
	if err := s.db.First(&inst).Error; err != nil {
		// If no institution exists, create one with just the logo?
		// Better to require institution to exist or create a blank one.
		inst = institution.Institucion{}
		s.db.Create(&inst)
	}

	inst.LogoPath = filePath
	if err := s.db.Save(&inst).Error; err != nil {
		return "", err
	}

	return filePath, nil
}

func (s *InstitutionService) GetLogo() (string, error) {
	var inst institution.Institucion
	if err := s.db.First(&inst).Error; err != nil {
		return "", err
	}

	if inst.LogoPath == "" {
		return "", nil
	}

	data, err := os.ReadFile(inst.LogoPath)
	if err != nil {
		return "", nil // Return empty if file not found
	}

	base64Str := base64.StdEncoding.EncodeToString(data)
	// Assuming PNG for simplicity or generic image
	return fmt.Sprintf("data:image/png;base64,%s", base64Str), nil
}
