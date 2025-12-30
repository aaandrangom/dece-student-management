package services

import (
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

	"gorm.io/gorm"
)

type StudentService struct {
	db *gorm.DB
}

func NewStudentService(db *gorm.DB) *StudentService {
	return &StudentService{db: db}
}

func (s *StudentService) BuscarEstudiantes(query string) ([]studentDTO.EstudianteListaDTO, error) {
	var estudiantes []student.Estudiante
	query = strings.TrimSpace(query)
	likeQuery := "%" + query + "%"

	result := s.db.
		Where("cedula LIKE ?", likeQuery).
		Or("apellidos LIKE ? OR nombres LIKE ?", likeQuery, likeQuery).
		Order("apellidos ASC").
		Limit(20).
		Find(&estudiantes)

	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]studentDTO.EstudianteListaDTO, len(estudiantes))
	for i, e := range estudiantes {
		response[i] = studentDTO.EstudianteListaDTO{
			ID:        e.ID,
			Cedula:    e.Cedula,
			Apellidos: e.Apellidos,
			Nombres:   e.Nombres,
			RutaFoto:  e.RutaFoto,
		}
	}
	return response, nil
}

func (s *StudentService) ObtenerEstudiante(id uint) (*student.Estudiante, error) {
	var est student.Estudiante
	err := s.db.Preload("Familiares").First(&est, id).Error
	if err != nil {
		return nil, errors.New("estudiante no encontrado")
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
			return fmt.Errorf("la cédula %s ya pertenece a otro estudiante", input.Cedula)
		}

		est := student.Estudiante{
			ID:               input.ID,
			Cedula:           input.Cedula,
			Apellidos:        strings.ToUpper(input.Apellidos),
			Nombres:          strings.ToUpper(input.Nombres),
			FechaNacimiento:  input.FechaNacimiento,
			GeneroNacimiento: input.GeneroNacimiento,

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
			return fmt.Errorf("error al guardar ficha completa: %v", err)
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
		return "", errors.New("estudiante no encontrado")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("no se pudo acceder a la carpeta del usuario")
	}

	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "FotosEstudiantes")

	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("error al crear carpeta de fotos: %v", err)
	}

	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".jpg"
	}

	nuevoNombre := fmt.Sprintf("%s_%d%s", est.Cedula, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	srcFile, err := os.Open(rutaOrigen)
	if err != nil {
		return "", fmt.Errorf("error al leer imagen original: %v", err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(rutaDestinoCompleta)
	if err != nil {
		return "", fmt.Errorf("error al crear imagen destino: %v", err)
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return "", fmt.Errorf("error al copiar imagen: %v", err)
	}

	if est.RutaFoto != "" {
		if _, err := os.Stat(est.RutaFoto); err == nil {
			os.Remove(est.RutaFoto)
		}
	}

	if err := s.db.Model(&est).Update("ruta_foto", rutaDestinoCompleta).Error; err != nil {
		return "", fmt.Errorf("imagen copiada pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *StudentService) GuardarFotoBase64(id uint, dataURL string, filename string) (string, error) {
	var est student.Estudiante

	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("estudiante no encontrado")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("no se pudo acceder a la carpeta del usuario")
	}

	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "FotosEstudiantes")

	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("error al crear carpeta de fotos: %v", err)
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
		return "", fmt.Errorf("error al decodificar base64: %v", err)
	}

	nuevoNombre := fmt.Sprintf("%s_%d%s", est.Cedula, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	if err := os.WriteFile(rutaDestinoCompleta, decoded, 0644); err != nil {
		return "", fmt.Errorf("error al escribir imagen destino: %v", err)
	}

	if est.RutaFoto != "" {
		if _, err := os.Stat(est.RutaFoto); err == nil {
			os.Remove(est.RutaFoto)
		}
	}

	if err := s.db.Model(&est).Update("ruta_foto", rutaDestinoCompleta).Error; err != nil {
		return "", fmt.Errorf("imagen guardada pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *StudentService) ObtenerFotoBase64(id uint) (string, error) {
	var est student.Estudiante

	if err := s.db.First(&est, id).Error; err != nil {
		return "", errors.New("estudiante no encontrado")
	}

	if est.RutaFoto == "" {
		return "", errors.New("estudiante no tiene foto")
	}

	data, err := os.ReadFile(est.RutaFoto)
	if err != nil {
		return "", fmt.Errorf("error leyendo archivo: %v", err)
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
		return errors.New("familiar no encontrado")
	}
	return nil
}
