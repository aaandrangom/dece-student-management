package services

import (
	"context"
	enrollmentDTO "dece/internal/application/dtos/enrollment"
	"dece/internal/domain/common"
	domain "dece/internal/domain/enrollment"
	"dece/internal/domain/faculty"
	"dece/internal/domain/student"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gorm.io/gorm"
)

type EnrollmentService struct {
	db  *gorm.DB
	ctx context.Context
}

func NewEnrollmentService(db *gorm.DB) *EnrollmentService {
	return &EnrollmentService{db: db}
}

func (s *EnrollmentService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *EnrollmentService) LeerArchivoParaVista(ruta string) (string, error) {
	if ruta == "" {
		return "", nil
	}

	data, err := os.ReadFile(ruta)
	if err != nil {
		if os.IsNotExist(err) {
			homeDir, herr := os.UserHomeDir()
			if herr == nil {
				destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "DocumentosEstudiantes")
				base := filepath.Base(ruta)
				parts := strings.Split(base, "_")
				if len(parts) >= 2 {
					prefix := parts[0] + "_" + parts[1]
					files, readErr := os.ReadDir(destinoDir)
					if readErr == nil {
						for _, f := range files {
							if strings.Contains(f.Name(), prefix) {
								candidate := filepath.Join(destinoDir, f.Name())
								d2, r2 := os.ReadFile(candidate)
								if r2 == nil {
									mimeType := http.DetectContentType(d2)
									encoded := base64.StdEncoding.EncodeToString(d2)
									return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded), nil
								}
							}
						}
					}
				}
			}
		}
		return "", fmt.Errorf("No se pudo leer el archivo: %v", err)
	}

	mimeType := http.DetectContentType(data)

	encoded := base64.StdEncoding.EncodeToString(data)

	return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded), nil
}

func (s *EnrollmentService) SeleccionarArchivo(tipo string) (string, error) {
	var filters []runtime.FileFilter
	if tipo == "imagen" {
		filters = []runtime.FileFilter{{DisplayName: "Imágenes", Pattern: "*.png;*.jpg;*.jpeg"}}
	} else {
		filters = []runtime.FileFilter{{DisplayName: "PDF", Pattern: "*.pdf"}}
	}

	selection, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title:   "Seleccionar Archivo",
		Filters: filters,
	})
	return selection, err
}

func (s *EnrollmentService) guardarArchivo(rutaOrigen string, subCarpeta string, prefijoNombre string) (string, error) {
	if rutaOrigen == "" {
		return "", nil
	}

	if strings.Contains(rutaOrigen, "SistemaDECE") {
		return rutaOrigen, nil
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("No se pudo obtener carpeta de usuario")
	}

	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", subCarpeta)

	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error creando carpeta %s: %v", subCarpeta, err)
	}

	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".pdf"
	}

	nuevoNombre := fmt.Sprintf("%s_%d%s", prefijoNombre, time.Now().UnixNano(), ext)
	rutaDestino := filepath.Join(destinoDir, nuevoNombre)

	srcFile, err := os.Open(rutaOrigen)
	if err != nil {
		return "", fmt.Errorf("No se pudo leer el archivo original: %v", err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(rutaDestino)
	if err != nil {
		return "", fmt.Errorf("No se pudo crear el archivo destino: %v", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return "", fmt.Errorf("Error copiando datos: %v", err)
	}

	return rutaDestino, nil
}

func (s *EnrollmentService) ObtenerMatriculaActual(estudianteID uint) (*enrollmentDTO.MatriculaResponseDTO, error) {
	var matricula domain.Matricula

	err := s.db.
		Joins("JOIN cursos c ON c.id = matriculas.curso_id").
		Joins("JOIN periodo_lectivos p ON p.id = c.periodo_id").
		Where("matriculas.estudiante_id = ? AND p.es_activo = ?", estudianteID, true).
		First(&matricula).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	response := &enrollmentDTO.MatriculaResponseDTO{
		GuardarMatriculaDTO: enrollmentDTO.GuardarMatriculaDTO{
			ID:                 matricula.ID,
			EstudianteID:       matricula.EstudianteID,
			CursoID:            matricula.CursoID,
			EsRepetidor:        matricula.EsRepetidor,
			Antropometria:      matricula.Antropometria.Data,
			HistorialAcademico: matricula.HistorialAcademico.Data,
			DatosSalud:         matricula.DatosSalud.Data,
			DatosSociales:      matricula.DatosSociales.Data,
			CondicionGenero:    matricula.CondicionGenero.Data,
			DireccionActual:    matricula.DireccionActual,
			RutaCroquis:        matricula.RutaCroquis,
		},
		Estado: matricula.Estado,
	}

	return response, nil
}

func (s *EnrollmentService) GuardarMatricula(input enrollmentDTO.GuardarMatriculaDTO) (*domain.Matricula, error) {

	var est student.Estudiante
	if err := s.db.Select("cedula").First(&est, input.EstudianteID).Error; err != nil {
		return nil, errors.New("Estudiante no encontrado para procesar archivos")
	}

	if input.DatosSalud.TieneEvalPsicopedagogica && input.DatosSalud.RutaEvalPsicopedagogica != "" {
		newPath, err := s.guardarArchivo(
			input.DatosSalud.RutaEvalPsicopedagogica,
			"DocumentosEstudiantes",
			"EVAL_"+est.Cedula,
		)
		if err == nil {
			input.DatosSalud.RutaEvalPsicopedagogica = newPath
		} else {
			fmt.Printf("Error guardando PDF eval: %v\n", err)
		}
	} else {
		if !input.DatosSalud.TieneEvalPsicopedagogica {
			input.DatosSalud.RutaEvalPsicopedagogica = ""
		}
	}

	if input.RutaCroquis != "" {
		newPath, err := s.guardarArchivo(
			input.RutaCroquis,
			"DocumentosEstudiantes",
			"CROQUIS_"+est.Cedula,
		)
		if err == nil {
			input.RutaCroquis = newPath
		}
	}

	if input.ID == 0 {
		var curso faculty.Curso
		if err := s.db.First(&curso, input.CursoID).Error; err != nil {
			return nil, errors.New("El curso seleccionado no existe")
		}

		var count int64
		s.db.Table("matriculas").
			Joins("JOIN cursos c ON c.id = matriculas.curso_id").
			Where("matriculas.estudiante_id = ? AND c.periodo_id = ?", input.EstudianteID, curso.PeriodoID).
			Count(&count)

		if count > 0 {
			return nil, errors.New("El estudiante ya se encuentra matriculado en este periodo lectivo")
		}
	}

	mat := domain.Matricula{
		ID:           input.ID,
		EstudianteID: input.EstudianteID,
		CursoID:      input.CursoID,
		EsRepetidor:  input.EsRepetidor,

		Antropometria:      common.JSONMap[domain.Antropometria]{Data: input.Antropometria},
		HistorialAcademico: common.JSONMap[domain.HistorialAcademico]{Data: input.HistorialAcademico},
		DatosSalud:         common.JSONMap[domain.DatosSalud]{Data: input.DatosSalud},
		DatosSociales:      common.JSONMap[domain.DatosSociales]{Data: input.DatosSociales},
		CondicionGenero:    common.JSONMap[domain.CondicionGenero]{Data: input.CondicionGenero},

		DireccionActual: input.DireccionActual,
		RutaCroquis:     input.RutaCroquis,
	}

	if mat.ID == 0 {
		mat.Estado = "Matriculado"
		mat.FechaRegistro = time.Now().Format("2006-01-02 15:04:05")

	} else {
		var matAnterior domain.Matricula
		s.db.Select("estado", "fecha_registro").First(&matAnterior, mat.ID)

		mat.Estado = matAnterior.Estado
		mat.FechaRegistro = matAnterior.FechaRegistro
	}

	if err := s.db.Save(&mat).Error; err != nil {
		return nil, fmt.Errorf("Error al procesar la matrícula: %v", err)
	}

	return &mat, nil
}

func (s *EnrollmentService) ObtenerHistorial(estudianteID uint) ([]enrollmentDTO.HistorialMatriculaDTO, error) {
	type Result struct {
		ID            uint
		PeriodoNombre string
		CursoNivel    string
		CursoParalelo string
		Estado        string
		FechaRegistro string
	}
	var data []Result
	err := s.db.Table("matriculas").
		Select("matriculas.id, periodo_lectivos.nombre as periodo_nombre, niveles_educativos.nombre as curso_nivel, cursos.paralelo as curso_paralelo, matriculas.estado, matriculas.fecha_registro").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Joins("JOIN periodo_lectivos ON periodo_lectivos.id = cursos.periodo_id").
		Joins("JOIN niveles_educativos ON niveles_educativos.id = cursos.nivel_id").
		Where("matriculas.estudiante_id = ?", estudianteID).
		Order("periodo_lectivos.fecha_inicio DESC").
		Scan(&data).Error

	if err != nil {
		return nil, err
	}
	response := make([]enrollmentDTO.HistorialMatriculaDTO, len(data))
	for i, d := range data {
		response[i] = enrollmentDTO.HistorialMatriculaDTO{
			ID:             d.ID,
			PeriodoLectivo: d.PeriodoNombre,
			CursoNombre:    fmt.Sprintf("%s %s", d.CursoNivel, d.CursoParalelo),
			Estado:         d.Estado,
			Fecha:          d.FechaRegistro,
		}
	}
	return response, nil
}

func (s *EnrollmentService) RetirarEstudiante(matriculaID uint, motivo string) error {
	var matricula domain.Matricula
	if err := s.db.First(&matricula, matriculaID).Error; err != nil {
		return errors.New("Matrícula no encontrada")
	}
	matricula.Estado = "Retirado"
	if err := s.db.Save(&matricula).Error; err != nil {
		return fmt.Errorf("Error al retirar estudiante: %v", err)
	}
	return nil
}
