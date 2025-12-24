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

type HealthService struct {
	db *gorm.DB
}

func NewHealthService(db *gorm.DB) *HealthService {
	return &HealthService{db: db}
}

type HealthDataDTO struct {
	HistorialID uint `json:"historial_id"`

	// Contexto
	EstudianteID     uint   `json:"estudiante_id"`
	NombresCompletos string `json:"nombres_completos"`
	Genero           string `json:"genero"`

	// Salud
	Discapacidad              bool   `json:"discapacidad"`
	PorcentajeDiscapacidad    int    `json:"porcentaje_discapacidad"`
	TipoDiscapacidad          string `json:"tipo_discapacidad"`
	DetallesDiscapacidad      string `json:"detalles_discapacidad"`
	EvaluacionPsicopedagogica bool   `json:"evaluacion_psicopedagogica"`
	ArchivoEvaluacionPath     string `json:"archivo_evaluacion_path"`
	Alergias                  string `json:"alergias"`
	Cirugias                  string `json:"cirugias"`
	Enfermedades              string `json:"enfermedades"`

	// Genero
	SituacionGenero string `json:"situacion_genero"`
	MesesTiempo     int    `json:"meses_tiempo"`
	ControlesSalud  bool   `json:"controles_salud"`
	RiesgoEmbarazo  bool   `json:"riesgo_embarazo"`
	NombrePareja    string `json:"nombre_pareja"`
	EdadPareja      int    `json:"edad_pareja"`

	// Convivientes
	Convivientes []welfare.ConvivienteHogar `json:"convivientes"`
}

// GetHealthData obtiene la ficha de salud y vulnerabilidad
func (s *HealthService) GetHealthData(estudianteID uint) (*HealthDataDTO, error) {
	// 1. Buscar Historial Académico más reciente (o activo)
	var historial student.HistorialAcademico
	err := s.db.Preload("Aula").
		Preload("Aula.AnioLectivo").
		Preload("Estudiante").
		Where("estudiante_id = ?", estudianteID).
		Order("id desc").
		First(&historial).Error

	if err != nil {
		return nil, fmt.Errorf("estudiante sin historial académico")
	}

	// 2. Buscar o Crear Ficha de Salud
	var salud welfare.SaludVulnerabilidad
	if err := s.db.Where("historial_id = ?", historial.ID).First(&salud).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Crear ficha vacía si no existe
			salud = welfare.SaludVulnerabilidad{HistorialID: historial.ID}
			s.db.Create(&salud)
		} else {
			return nil, err
		}
	}

	// 3. Buscar Convivientes
	var convivientes []welfare.ConvivienteHogar
	s.db.Where("historial_id = ?", historial.ID).Find(&convivientes)

	return &HealthDataDTO{
		HistorialID:               historial.ID,
		EstudianteID:              historial.EstudianteID,
		NombresCompletos:          historial.Estudiante.Apellidos + " " + historial.Estudiante.Nombres,
		Genero:                    historial.Estudiante.Genero,
		Discapacidad:              salud.Discapacidad,
		PorcentajeDiscapacidad:    salud.PorcentajeDiscapacidad,
		TipoDiscapacidad:          salud.TipoDiscapacidad,
		DetallesDiscapacidad:      salud.DetallesDiscapacidad,
		EvaluacionPsicopedagogica: salud.EvaluacionPsicopedagogica,
		ArchivoEvaluacionPath:     salud.ArchivoEvaluacionPath,
		Alergias:                  salud.Alergias,
		Cirugias:                  salud.Cirugias,
		Enfermedades:              salud.Enfermedades,
		SituacionGenero:           salud.SituacionGenero,
		MesesTiempo:               salud.MesesTiempo,
		ControlesSalud:            salud.ControlesSalud,
		RiesgoEmbarazo:            salud.RiesgoEmbarazo,
		NombrePareja:              salud.NombrePareja,
		EdadPareja:                salud.EdadPareja,
		Convivientes:              convivientes,
	}, nil
}

// SaveHealthData guarda los cambios en la ficha
func (s *HealthService) SaveHealthData(data HealthDataDTO) error {
	return s.db.Session(&gorm.Session{SkipDefaultTransaction: true}).Model(&welfare.SaludVulnerabilidad{}).
		Where("historial_id = ?", data.HistorialID).
		Updates(map[string]interface{}{
			"discapacidad":               data.Discapacidad,
			"porcentaje_discapacidad":    data.PorcentajeDiscapacidad,
			"tipo_discapacidad":          data.TipoDiscapacidad,
			"detalles_discapacidad":      data.DetallesDiscapacidad,
			"evaluacion_psicopedagogica": data.EvaluacionPsicopedagogica,
			"alergias":                   data.Alergias,
			"cirugias":                   data.Cirugias,
			"enfermedades":               data.Enfermedades,
			"situacion_genero":           data.SituacionGenero,
			"meses_tiempo":               data.MesesTiempo,
			"controles_salud":            data.ControlesSalud,
			"riesgo_embarazo":            data.RiesgoEmbarazo,
			"nombre_pareja":              data.NombrePareja,
			"edad_pareja":                data.EdadPareja,
		}).Error
}

// AddCohabitant agrega un conviviente
func (s *HealthService) AddCohabitant(historialID uint, nombre string, parentesco string, edad int) error {
	conviviente := welfare.ConvivienteHogar{
		HistorialID:      historialID,
		NombresCompletos: nombre,
		Parentesco:       parentesco,
		Edad:             edad,
	}
	return s.db.Create(&conviviente).Error
}

// RemoveCohabitant elimina un conviviente
func (s *HealthService) RemoveCohabitant(id uint) error {
	return s.db.Delete(&welfare.ConvivienteHogar{}, id).Error
}

// UploadEvaluationFile sube el archivo de evaluación psicopedagógica
func (s *HealthService) UploadEvaluationFile(historialID uint, fileBase64 string) error {
	parts := strings.Split(fileBase64, ",")
	if len(parts) != 2 {
		return fmt.Errorf("formato de archivo inválido")
	}

	header := parts[0] // data:image/png;base64
	ext := ".pdf"      // default
	if strings.Contains(header, "image/jpeg") {
		ext = ".jpg"
	} else if strings.Contains(header, "image/png") {
		ext = ".png"
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return fmt.Errorf("error decodificando archivo: %v", err)
	}

	// Directorio
	uploadDir := "uploads/evaluations"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return err
	}

	filename := fmt.Sprintf("eval_%d_%d%s", historialID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return err
	}

	absPath, _ := filepath.Abs(filePath)

	return s.db.Session(&gorm.Session{SkipDefaultTransaction: true}).Model(&welfare.SaludVulnerabilidad{}).
		Where("historial_id = ?", historialID).
		Update("archivo_evaluacion_path", absPath).Error
}

// GetEvaluationFile obtiene el contenido del archivo en base64 para previsualización
func (s *HealthService) GetEvaluationFile(historialID uint) (string, error) {
	var salud welfare.SaludVulnerabilidad
	if err := s.db.Where("historial_id = ?", historialID).First(&salud).Error; err != nil {
		return "", err
	}

	if salud.ArchivoEvaluacionPath == "" {
		return "", nil
	}

	data, err := os.ReadFile(salud.ArchivoEvaluacionPath)
	if err != nil {
		return "", fmt.Errorf("error leyendo archivo: %v", err)
	}

	ext := strings.ToLower(filepath.Ext(salud.ArchivoEvaluacionPath))
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
