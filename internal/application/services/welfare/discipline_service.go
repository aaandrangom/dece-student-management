package welfare

import (
	"dece/internal/domain/student"
	"dece/internal/domain/welfare"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"
)

type DisciplineService struct {
	db *gorm.DB
}

func NewDisciplineService(db *gorm.DB) *DisciplineService {
	return &DisciplineService{db: db}
}

type DisciplineCaseDTO struct {
	ID                uint      `json:"id"`
	HistorialID       uint      `json:"historial_id"`
	EstudianteID      uint      `json:"estudiante_id"`
	Fecha             time.Time `json:"fecha"`
	Tipo              string    `json:"tipo"`
	Subtipo           string    `json:"subtipo"`
	DescripcionMotivo string    `json:"descripcion_motivo"`
	Gravedad          string    `json:"gravedad"`

	AccionesRealizadas string     `json:"acciones_realizadas"`
	Resolucion         string     `json:"resolucion"`
	DerivadoA          string     `json:"derivado_a"`
	FechaDerivacion    *time.Time `json:"fecha_derivacion"`
	ArchivoAdjuntoPath string     `json:"archivo_adjunto_path"`
	ArchivoActaPath    string     `json:"archivo_acta_path"`
	Estado             string     `json:"estado"`

	NotificoRepresentante bool   `json:"notifico_representante"`
	FirmoActa             bool   `json:"firmo_acta"`
	MotivoNoFirma         string `json:"motivo_no_firma"`
	CumplioMedida         bool   `json:"cumplio_medida"`
}

func (s *DisciplineService) GetDisciplineCases(estudianteID uint) ([]DisciplineCaseDTO, error) {
	return s.getCasesByType(estudianteID, "DISCIPLINA")
}

func (s *DisciplineService) GetViolenceCases(estudianteID uint) ([]DisciplineCaseDTO, error) {
	return s.getCasesByType(estudianteID, "VIOLENCIA")
}

func (s *DisciplineService) getCasesByType(estudianteID uint, tipo string) ([]DisciplineCaseDTO, error) {
	var historial student.HistorialAcademico
	err := s.db.Where("estudiante_id = ?", estudianteID).
		Order("id desc").
		First(&historial).Error

	if err != nil {
		return nil, fmt.Errorf("estudiante sin historial académico")
	}

	var casos []welfare.DisciplinaCaso
	if err := s.db.Where("historial_id = ? AND tipo = ?", historial.ID, tipo).Order("fecha desc").Find(&casos).Error; err != nil {
		return nil, err
	}

	var dtos []DisciplineCaseDTO
	for _, c := range casos {
		dtos = append(dtos, DisciplineCaseDTO{
			ID:                    c.ID,
			HistorialID:           c.HistorialID,
			EstudianteID:          estudianteID,
			Fecha:                 c.Fecha,
			Tipo:                  c.Tipo,
			Subtipo:               c.Subtipo,
			DescripcionMotivo:     c.DescripcionMotivo,
			Gravedad:              c.Gravedad,
			AccionesRealizadas:    c.AccionesRealizadas,
			Resolucion:            c.Resolucion,
			DerivadoA:             c.DerivadoA,
			FechaDerivacion:       c.FechaDerivacion,
			ArchivoAdjuntoPath:    c.ArchivoAdjuntoPath,
			ArchivoActaPath:       c.ArchivoActaPath,
			Estado:                c.Estado,
			NotificoRepresentante: c.NotificoRepresentante,
			FirmoActa:             c.FirmoActa,
			MotivoNoFirma:         c.MotivoNoFirma,
			CumplioMedida:         c.CumplioMedida,
		})
	}

	return dtos, nil
}

func (s *DisciplineService) SaveDisciplineCase(dto DisciplineCaseDTO) error {
	caso := welfare.DisciplinaCaso{
		ID:                    dto.ID,
		HistorialID:           dto.HistorialID,
		Fecha:                 dto.Fecha,
		Tipo:                  dto.Tipo,
		Subtipo:               dto.Subtipo,
		DescripcionMotivo:     dto.DescripcionMotivo,
		Gravedad:              dto.Gravedad,
		AccionesRealizadas:    dto.AccionesRealizadas,
		Resolucion:            dto.Resolucion,
		DerivadoA:             dto.DerivadoA,
		FechaDerivacion:       dto.FechaDerivacion,
		Estado:                dto.Estado,
		NotificoRepresentante: dto.NotificoRepresentante,
		FirmoActa:             dto.FirmoActa,
		MotivoNoFirma:         dto.MotivoNoFirma,
		CumplioMedida:         dto.CumplioMedida,
	}

	if caso.ID == 0 {
		if caso.HistorialID == 0 && dto.EstudianteID != 0 {
			var historial student.HistorialAcademico
			if err := s.db.Where("estudiante_id = ?", dto.EstudianteID).Order("id desc").First(&historial).Error; err == nil {
				caso.HistorialID = historial.ID
			}
		}
		return s.db.Create(&caso).Error
	}

	return s.db.Session(&gorm.Session{SkipDefaultTransaction: true}).Model(&caso).Updates(caso).Error
}

func (s *DisciplineService) DeleteDisciplineCase(id uint) error {
	return s.db.Delete(&welfare.DisciplinaCaso{}, id).Error
}

func (s *DisciplineService) UploadSignedAct(casoID uint, fileBase64 string) error {
	parts := strings.Split(fileBase64, ",")
	if len(parts) != 2 {
		return fmt.Errorf("formato de archivo inválido")
	}

	header := parts[0]
	ext := ".pdf"
	if strings.Contains(header, "image/jpeg") {
		ext = ".jpg"
	} else if strings.Contains(header, "image/png") {
		ext = ".png"
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return fmt.Errorf("error decodificando archivo: %v", err)
	}

	uploadDir := "uploads/discipline"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return err
	}

	filename := fmt.Sprintf("acta_%d_%d%s", casoID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return err
	}

	absPath, _ := filepath.Abs(filePath)

	return s.db.Session(&gorm.Session{SkipDefaultTransaction: true}).Model(&welfare.DisciplinaCaso{}).
		Where("id = ?", casoID).
		Update("archivo_acta_path", absPath).Error
}

func (s *DisciplineService) GetSignedAct(casoID uint) (string, error) {
	var caso welfare.DisciplinaCaso
	if err := s.db.First(&caso, casoID).Error; err != nil {
		return "", err
	}

	if caso.ArchivoActaPath == "" {
		return "", nil
	}

	data, err := os.ReadFile(caso.ArchivoActaPath)
	if err != nil {
		return "", fmt.Errorf("error leyendo archivo: %v", err)
	}

	ext := strings.ToLower(filepath.Ext(caso.ArchivoActaPath))
	mimeType := "application/octet-stream"
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".png":
		mimeType = "image/png"
	case ".pdf":
		mimeType = "application/pdf"
	}

	b64 := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, b64), nil
}
