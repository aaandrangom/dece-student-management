package services

import (
	"context"
	enrollmentDTO "dece/internal/application/dtos/enrollment"
	"dece/internal/application/helpers/busqueda"
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

// ObtenerMatriculaActual devuelve la matrícula vigente del periodo activo. Si el estudiante
// fue retirado en este periodo, devuelve los datos de esa matrícula con ID 0 y estado
// "Retirado": al guardar se crea una matrícula nueva (reingreso) y el retiro queda en el historial.
func (s *EnrollmentService) ObtenerMatriculaActual(estudianteID uint) (*enrollmentDTO.MatriculaResponseDTO, error) {
	var matricula domain.Matricula

	err := s.db.
		Joins("JOIN cursos c ON c.id = matriculas.curso_id").
		Joins("JOIN periodo_lectivos p ON p.id = c.periodo_id").
		Where("matriculas.estudiante_id = ? AND p.es_activo = ?", estudianteID, true).
		Order("CASE WHEN matriculas.estado = 'Matriculado' THEN 0 ELSE 1 END, matriculas.id DESC").
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
			RutaConsentimiento: matricula.RutaConsentimiento,
			Estado:             matricula.Estado,
		},
	}

	if matricula.Estado == estadoRetirado {
		response.ID = 0
	}

	return response, nil
}

const (
	estadoMatriculado = "Matriculado"
	estadoRetirado    = "Retirado"
)

// cursoEnPeriodoEditable valida que el curso exista y pertenezca al periodo activo y abierto.
func (s *EnrollmentService) cursoEnPeriodoEditable(tx *gorm.DB, cursoID uint) (*faculty.Curso, error) {
	var curso faculty.Curso
	if err := tx.Preload("Periodo").First(&curso, cursoID).Error; err != nil {
		return nil, errors.New("El curso seleccionado no existe")
	}
	if !curso.Periodo.EsActivo || curso.Periodo.Cerrado {
		return nil, errors.New("Solo se pueden registrar matrículas en el periodo lectivo activo y abierto")
	}
	return &curso, nil
}

func (s *EnrollmentService) GuardarMatricula(input enrollmentDTO.GuardarMatriculaDTO) (*domain.Matricula, error) {

	var est student.Estudiante
	if err := s.db.Select("cedula").First(&est, input.EstudianteID).Error; err != nil {
		return nil, errors.New("Estudiante no encontrado")
	}

	curso, err := s.cursoEnPeriodoEditable(s.db, input.CursoID)
	if err != nil {
		return nil, err
	}

	var matAnterior domain.Matricula
	if input.ID > 0 {
		if err := s.db.First(&matAnterior, input.ID).Error; err != nil {
			return nil, errors.New("Matrícula no encontrada")
		}
		if matAnterior.EstudianteID != input.EstudianteID {
			return nil, errors.New("La matrícula no pertenece a este estudiante")
		}
		if _, err := s.cursoEnPeriodoEditable(s.db, matAnterior.CursoID); err != nil {
			return nil, err
		}
		if matAnterior.Estado != estadoMatriculado {
			return nil, errors.New("La matrícula está retirada; registre un reingreso desde la Ficha DECE")
		}
	}

	// Solo cuenta matrículas vigentes: un estudiante retirado puede reingresar en el mismo periodo.
	var count int64
	if err := s.db.Table("matriculas").
		Joins("JOIN cursos c ON c.id = matriculas.curso_id").
		Where("matriculas.estudiante_id = ? AND c.periodo_id = ? AND matriculas.estado = ? AND matriculas.id <> ?",
			input.EstudianteID, curso.PeriodoID, estadoMatriculado, input.ID).
		Count(&count).Error; err != nil {
		return nil, fmt.Errorf("Error al verificar matrículas: %v", err)
	}
	if count > 0 {
		return nil, errors.New("El estudiante ya se encuentra matriculado en este periodo lectivo")
	}

	// Los archivos se copian después de validar, para no dejar copias huérfanas.
	// Si una copia falla se cancela el guardado: guardar la ruta original perdería el documento
	// cuando el usuario mueva o borre el archivo.
	if !input.DatosSalud.TieneEvalPsicopedagogica {
		input.DatosSalud.RutaEvalPsicopedagogica = ""
	}
	archivos := []struct {
		ruta    *string
		prefijo string
		nombre  string
	}{
		{&input.DatosSalud.RutaEvalPsicopedagogica, "EVAL_", "la evaluación psicopedagógica"},
		{&input.RutaCroquis, "CROQUIS_", "el croquis"},
		{&input.RutaConsentimiento, "CONSENTIMIENTO_", "el consentimiento"},
	}
	for _, a := range archivos {
		nuevaRuta, err := s.guardarArchivo(*a.ruta, "DocumentosEstudiantes", a.prefijo+est.Cedula)
		if err != nil {
			return nil, fmt.Errorf("No se pudo guardar %s: %v", a.nombre, err)
		}
		*a.ruta = nuevaRuta
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

		DireccionActual:    input.DireccionActual,
		RutaCroquis:        input.RutaCroquis,
		RutaConsentimiento: input.RutaConsentimiento,
	}

	if mat.ID == 0 {
		mat.Estado = estadoMatriculado
		mat.FechaRegistro = time.Now().Format("2006-01-02 15:04:05")
	} else {
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
		Select("matriculas.id, periodo_lectivos.nombre as periodo_nombre, nivel_educativos.nombre as curso_nivel, cursos.paralelo as curso_paralelo, matriculas.estado, matriculas.fecha_registro").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Joins("JOIN periodo_lectivos ON periodo_lectivos.id = cursos.periodo_id").
		Joins("JOIN nivel_educativos ON nivel_educativos.id = cursos.nivel_id").
		Where("matriculas.estudiante_id = ?", estudianteID).
		Order("periodo_lectivos.fecha_inicio DESC, matriculas.id DESC").
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

// BuscarParaRetiro lista las matrículas del periodo activo (vigentes y retiradas) que coinciden
// con la búsqueda. Las retiradas se muestran para poder revertir un retiro hecho por error.
func (s *EnrollmentService) BuscarParaRetiro(query string) ([]enrollmentDTO.EstudianteRetiroDTO, error) {
	palabras := busqueda.Palabras(query)
	if len(palabras) == 0 {
		return []enrollmentDTO.EstudianteRetiroDTO{}, nil
	}

	var filas []enrollmentDTO.EstudianteRetiroDTO
	err := s.db.Table("matriculas").
		Select(`estudiantes.id AS estudiante_id, matriculas.id AS matricula_id, estudiantes.cedula,
			estudiantes.nombres, estudiantes.apellidos, matriculas.estado,
			nivel_educativos.nombre || ' ' || cursos.paralelo AS curso,
			retiro_estudiantes.fecha_retiro, retiro_estudiantes.motivo AS motivo_retiro`).
		Joins("JOIN estudiantes ON estudiantes.id = matriculas.estudiante_id").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Joins("JOIN nivel_educativos ON nivel_educativos.id = cursos.nivel_id").
		Joins("JOIN periodo_lectivos ON periodo_lectivos.id = cursos.periodo_id").
		Joins("LEFT JOIN retiro_estudiantes ON retiro_estudiantes.matricula_id = matriculas.id").
		Where("periodo_lectivos.es_activo = ?", true).
		Order("estudiantes.apellidos ASC, estudiantes.nombres ASC, matriculas.id DESC").
		Scan(&filas).Error
	if err != nil {
		return nil, fmt.Errorf("Error al buscar estudiantes: %v", err)
	}

	resultados := []enrollmentDTO.EstudianteRetiroDTO{}
	for _, f := range filas {
		if busqueda.Coincide(palabras, f.Cedula, f.Apellidos, f.Nombres) {
			resultados = append(resultados, f)
			if len(resultados) == 50 {
				break
			}
		}
	}
	return resultados, nil
}

func (s *EnrollmentService) RetirarEstudiante(matriculaID uint, motivo string) error {
	var matricula domain.Matricula
	if err := s.db.First(&matricula, matriculaID).Error; err != nil {
		return errors.New("Matrícula no encontrada")
	}
	matricula.Estado = estadoRetirado
	if err := s.db.Save(&matricula).Error; err != nil {
		return fmt.Errorf("Error al retirar estudiante: %v", err)
	}
	return nil
}

func (s *EnrollmentService) RegistrarRetiroCompleto(matriculaID uint, fecha string, motivo string, nuevaInstitucion string, provinciaDestino string, observaciones string) error {
	motivo = strings.TrimSpace(motivo)
	if motivo == "" {
		return errors.New("El motivo del retiro es obligatorio")
	}
	fechaRetiro, err := time.ParseInLocation("2006-01-02", fecha, time.Local)
	if err != nil {
		return errors.New("Fecha de retiro inválida (use AAAA-MM-DD)")
	}
	if fechaRetiro.After(time.Now()) {
		return errors.New("La fecha de retiro no puede ser futura")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		var matricula domain.Matricula
		if err := tx.First(&matricula, matriculaID).Error; err != nil {
			return errors.New("Matrícula no encontrada")
		}

		if matricula.Estado == estadoRetirado {
			return errors.New("El estudiante ya se encuentra retirado")
		}
		if _, err := s.cursoEnPeriodoEditable(tx, matricula.CursoID); err != nil {
			return err
		}

		if err := tx.Model(&matricula).Update("estado", estadoRetirado).Error; err != nil {
			return fmt.Errorf("Error al actualizar estado de matrícula: %v", err)
		}

		retiro := domain.RetiroEstudiante{
			MatriculaID:      matriculaID,
			FechaRetiro:      fecha,
			Motivo:           motivo,
			NuevaInstitucion: strings.TrimSpace(nuevaInstitucion),
			ProvinciaDestino: strings.TrimSpace(provinciaDestino),
			Observaciones:    strings.TrimSpace(observaciones),
		}

		if err := tx.Create(&retiro).Error; err != nil {
			return fmt.Errorf("Error al registrar el retiro: %v", err)
		}

		return nil
	})
}

// RevertirRetiro deshace un retiro registrado por error: la matrícula vuelve a "Matriculado"
// y se elimina el registro del retiro. No se permite si el estudiante ya reingresó con otra matrícula.
func (s *EnrollmentService) RevertirRetiro(matriculaID uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var matricula domain.Matricula
		if err := tx.First(&matricula, matriculaID).Error; err != nil {
			return errors.New("Matrícula no encontrada")
		}
		if matricula.Estado != estadoRetirado {
			return errors.New("La matrícula no está retirada")
		}
		curso, err := s.cursoEnPeriodoEditable(tx, matricula.CursoID)
		if err != nil {
			return err
		}

		var vigentes int64
		if err := tx.Table("matriculas").
			Joins("JOIN cursos c ON c.id = matriculas.curso_id").
			Where("matriculas.estudiante_id = ? AND c.periodo_id = ? AND matriculas.estado = ?", matricula.EstudianteID, curso.PeriodoID, estadoMatriculado).
			Count(&vigentes).Error; err != nil {
			return fmt.Errorf("Error al verificar matrículas: %v", err)
		}
		if vigentes > 0 {
			return errors.New("No se puede revertir: el estudiante ya tiene una matrícula vigente (reingreso) en este periodo")
		}

		if err := tx.Model(&matricula).Update("estado", estadoMatriculado).Error; err != nil {
			return fmt.Errorf("Error al revertir el retiro: %v", err)
		}
		if err := tx.Where("matricula_id = ?", matriculaID).Delete(&domain.RetiroEstudiante{}).Error; err != nil {
			return fmt.Errorf("Error al eliminar el registro de retiro: %v", err)
		}
		return nil
	})
}
