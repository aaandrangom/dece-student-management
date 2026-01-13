package services

import (
	"context"
	studentDTO "dece/internal/application/dtos/student"
	"dece/internal/domain/common"
	"dece/internal/domain/student"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type StudentService struct {
	ctx context.Context
	db  *gorm.DB
}

func NewStudentService(db *gorm.DB) *StudentService {
	return &StudentService{db: db}
}

func (s *StudentService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *StudentService) ImportarEstudiantes() (int, error) {
	if s.ctx == nil {
		return 0, errors.New("contexto no inicializado")
	}

	filePath, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title: "Seleccionar Archivo Excel",
		Filters: []runtime.FileFilter{
			{DisplayName: "Arrchivos Excel", Pattern: "*.xlsx;*.xlsm"},
		},
	})
	if err != nil {
		return 0, err
	}
	if filePath == "" {
		return 0, nil
	}

	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return 0, err
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return 0, err
	}

	idxCedula, idxNombres, idxApellidos, idxCorreo := -1, -1, -1, -1
	headerRowIndex := -1

	for i, row := range rows {
		foundCedula, foundNombres, foundApellidos := false, false, false
		for j, cell := range row {
			val := strings.ToLower(strings.TrimSpace(cell))
			if strings.Contains(val, "cedula") || strings.Contains(val, "cédula") {
				idxCedula = j
				foundCedula = true
			} else if val == "nombres" {
				idxNombres = j
				foundNombres = true
			} else if val == "apellidos" {
				idxApellidos = j
				foundApellidos = true
			} else if strings.Contains(val, "correo") || val == "email" {
				idxCorreo = j
			}
		}
		if foundCedula && foundNombres && foundApellidos {
			headerRowIndex = i
			break
		}
	}

	if headerRowIndex == -1 {
		return 0, errors.New("no se encontraron las columnas: Cedula, Nombres, Apellidos")
	}

	totalTotal := len(rows) - (headerRowIndex + 1)
	processedCount := 0
	count := 0
	for i := headerRowIndex + 1; i < len(rows); i++ {
		processedCount++
		// Emitir evento de progreso cada 5 registros o al final
		if processedCount%5 == 0 || processedCount == totalTotal {
			runtime.EventsEmit(s.ctx, "student:import_progress", map[string]int{
				"current": processedCount,
				"total":   totalTotal,
				"success": count,
			})
		}

		row := rows[i]
		getVal := func(idx int) string {
			if idx >= 0 && idx < len(row) {
				return strings.TrimSpace(row[idx])
			}
			return ""
		}

		cedula := getVal(idxCedula)
		nombres := getVal(idxNombres)
		apellidos := getVal(idxApellidos)
		correo := getVal(idxCorreo)

		if cedula == "" {
			continue
		}

		var resultados []student.Estudiante
		// Usamos Find con Limit 1 para evitar el error "record not found" en los logs cuando es nuevo
		if err := s.db.Where("cedula = ?", cedula).Limit(1).Find(&resultados).Error; err != nil {
			fmt.Printf("Error consultando cédula %s: %v\n", cedula, err)
			continue
		}

		if len(resultados) > 0 {
			// Actualizar existente
			existe := resultados[0]
			existe.Nombres = nombres
			existe.Apellidos = apellidos
			if correo != "" {
				existe.CorreoElectronico = correo
			}
			if err := s.db.Save(&existe).Error; err == nil {
				count++
			} else {
				fmt.Printf("Error al actualizar estudiante %s: %v\n", cedula, err)
			}
		} else {
			// Crear nuevo
			nuevo := student.Estudiante{
				Cedula:            cedula,
				Nombres:           nombres,
				Apellidos:         apellidos,
				CorreoElectronico: correo,
				InfoNacionalidad:  common.JSONMap[student.InfoNacionalidad]{Data: student.InfoNacionalidad{EsExtranjero: false}},
				GeneroNacimiento:  "M",
			}
			if err := s.db.Create(&nuevo).Error; err == nil {
				count++
			} else {
				fmt.Printf("Error al crear estudiante %s: %v\n", cedula, err)
			}
		}
	}

	return count, nil
}

func CaclularEdad(fechaNacimiento string) int {
	if fechaNacimiento == "" {
		return 0
	}

	nacimiento, err := time.Parse("2006-01-02", fechaNacimiento)
	if err != nil {
		return 0
	}

	hoy := time.Now()
	edad := hoy.Year() - nacimiento.Year()

	if hoy.Month() < nacimiento.Month() ||
		(hoy.Month() == nacimiento.Month() && hoy.Day() < nacimiento.Day()) {
		edad--
	}

	return edad
}

func (s *StudentService) BuscarEstudiantes(query string) ([]studentDTO.EstudianteListaDTO, error) {
	var estudiantes []student.Estudiante
	query = strings.TrimSpace(query)
	likeQuery := "%" + query + "%"

	result := s.db.
		Where("cedula LIKE ?", likeQuery).
		Or("apellidos LIKE ?", likeQuery).
		Or("nombres LIKE ?", likeQuery).
		Or("json_extract(info_nacionalidad, '$.pasaporte_odni') LIKE ?", likeQuery).
		Order("apellidos ASC").
		Limit(3000).
		Find(&estudiantes)

	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]studentDTO.EstudianteListaDTO, len(estudiantes))
	print(estudiantes)
	for i, e := range estudiantes {
		response[i] = studentDTO.EstudianteListaDTO{
			ID:                e.ID,
			Cedula:            e.Cedula,
			Apellidos:         e.Apellidos,
			Nombres:           e.Nombres,
			CorreoElectronico: e.CorreoElectronico,
			RutaFoto:          e.RutaFoto,
			FechaNacimiento:   e.FechaNacimiento,
			Edad:              CaclularEdad(e.FechaNacimiento),
			InfoNacionalidad: &studentDTO.InfoNacionalidadDTO{
				EsExtranjero:   e.InfoNacionalidad.Data.EsExtranjero,
				PaisOrigen:     e.InfoNacionalidad.Data.PaisOrigen,
				PasaporteOrDNI: e.InfoNacionalidad.Data.PasaporteOrDNI,
			},
		}
	}
	print(response)

	return response, nil
}

func (s *StudentService) ObtenerEstudiante(id uint) (*student.Estudiante, error) {
	var est student.Estudiante
	err := s.db.Preload("Familiares").First(&est, id).Error
	if err != nil {
		return nil, errors.New("Estudiante no encontrado")
	}
	return &est, nil
}

func (s *StudentService) GuardarEstudiante(input studentDTO.GuardarEstudianteDTO) (*student.Estudiante, error) {
	var estGuardado *student.Estudiante

	err := s.db.Transaction(func(tx *gorm.DB) error {

		var count int64
		query := tx.Model(&student.Estudiante{}).Where("cedula = ?", input.Cedula)
		if input.ID > 0 {
			query = query.Where("id <> ?", input.ID)
		}
		query.Count(&count)

		if count > 0 {
			return fmt.Errorf("La cédula %s ya pertenece a otro estudiante", input.Cedula)
		}

		est := student.Estudiante{
			ID:                input.ID,
			Cedula:            input.Cedula,
			Apellidos:         strings.ToUpper(input.Apellidos),
			Nombres:           strings.ToUpper(input.Nombres),
			FechaNacimiento:   input.FechaNacimiento,
			GeneroNacimiento:  input.GeneroNacimiento,
			CorreoElectronico: input.CorreoElectronico,

			RutaFoto: input.RutaFoto,
		}

		est.InfoNacionalidad = common.JSONMap[student.InfoNacionalidad]{
			Data: student.InfoNacionalidad{
				EsExtranjero:   input.EsExtranjero,
				PaisOrigen:     input.PaisOrigen,
				PasaporteOrDNI: input.PasaporteOrDNI,
			},
		}

		listaFamiliares := make([]student.Familiar, len(input.Familiares))

		for i, f := range input.Familiares {
			listaFamiliares[i] = student.Familiar{
				ID:                   f.ID,
				Cedula:               f.Cedula,
				NombresCompletos:     strings.ToUpper(f.NombresCompletos),
				Parentesco:           f.Parentesco,
				EsRepresentanteLegal: f.EsRepresentanteLegal,
				ViveConEstudiante:    f.ViveConEstudiante,
				TelefonoPersonal:     f.TelefonoPersonal,
				Fallecido:            f.Fallecido,

				DatosExtendidos: common.JSONMap[student.DatosFamiliar]{
					Data: student.DatosFamiliar{
						NivelInstruccion: f.DatosExtendidos.NivelInstruccion,
						Profesion:        f.DatosExtendidos.Profesion,
						LugarTrabajo:     f.DatosExtendidos.LugarTrabajo,
					},
				},
			}
		}

		est.Familiares = listaFamiliares

		if err := tx.Save(&est).Error; err != nil {
			return fmt.Errorf("Error al guardar ficha completa: %v", err)
		}

		estGuardado = &est
		return nil
	})

	if err != nil {
		return nil, err
	}

	return estGuardado, nil
}

func (s *StudentService) GuardarFoto(id uint, rutaOrigen string) (string, error) {
	var est student.Estudiante

	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("Estudiante no encontrado")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("No se pudo acceder a la carpeta del usuario")
	}

	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "FotosEstudiantes")

	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error al crear carpeta de fotos: %v", err)
	}

	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".jpg"
	}

	nuevoNombre := fmt.Sprintf("%s_%d%s", est.Cedula, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	srcFile, err := os.Open(rutaOrigen)
	if err != nil {
		return "", fmt.Errorf("Error al leer imagen original: %v", err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(rutaDestinoCompleta)
	if err != nil {
		return "", fmt.Errorf("Error al crear imagen destino: %v", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return "", fmt.Errorf("Error al copiar imagen: %v", err)
	}

	if est.RutaFoto != "" {
		if _, err := os.Stat(est.RutaFoto); err == nil {
			os.Remove(est.RutaFoto)
		}
	}

	if err := s.db.Model(&est).Update("ruta_foto", rutaDestinoCompleta).Error; err != nil {
		return "", fmt.Errorf("Imagen copiada pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *StudentService) GuardarFotoBase64(id uint, dataURL string, filename string) (string, error) {
	var est student.Estudiante

	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("Estudiante no encontrado")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("No se pudo acceder a la carpeta del usuario")
	}

	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "FotosEstudiantes")

	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error al crear carpeta de fotos: %v", err)
	}

	ext := filepath.Ext(filename)
	if ext == "" {
		if strings.HasPrefix(dataURL, "data:") {
			parts := strings.SplitN(dataURL, ";", 2)
			if len(parts) > 0 {
				mime := strings.TrimPrefix(parts[0], "data:")
				switch mime {
				case "image/png":
					ext = ".png"
				case "image/jpeg":
					ext = ".jpg"
				case "image/jpg":
					ext = ".jpg"
				case "image/gif":
					ext = ".gif"
				default:
					ext = ".jpg"
				}
			}
		} else {
			ext = ".jpg"
		}
	}

	payload := dataURL
	if _, after, ok := strings.Cut(dataURL, "base64,"); ok {
		payload = after
	}

	decoded, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return "", fmt.Errorf("Error al decodificar base64: %v", err)
	}

	nuevoNombre := fmt.Sprintf("%s_%d%s", est.Cedula, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	if err := os.WriteFile(rutaDestinoCompleta, decoded, 0644); err != nil {
		return "", fmt.Errorf("Error al escribir imagen destino: %v", err)
	}

	if est.RutaFoto != "" {
		if _, err := os.Stat(est.RutaFoto); err == nil {
			os.Remove(est.RutaFoto)
		}
	}

	if err := s.db.Model(&est).Update("ruta_foto", rutaDestinoCompleta).Error; err != nil {
		return "", fmt.Errorf("Imagen guardada pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *StudentService) ObtenerFotoBase64(id uint) (string, error) {
	var est student.Estudiante

	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("Estudiante no encontrado")
	}

	if est.RutaFoto == "" {
		return "", errors.New("Estudiante no tiene foto")
	}

	data, err := os.ReadFile(est.RutaFoto)
	if err != nil {
		return "", fmt.Errorf("Error leyendo archivo: %v", err)
	}

	ext := strings.ToLower(filepath.Ext(est.RutaFoto))
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, encoded)
	return dataURL, nil
}

func (s *StudentService) EliminarFamiliar(id uint) error {
	result := s.db.Delete(&student.Familiar{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("Familiar no encontrado")
	}
	return nil
}
