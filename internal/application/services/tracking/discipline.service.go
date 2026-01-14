package services

import (
	"context"
	dto "dece/internal/application/dtos/tracking"
	"dece/internal/domain/academic"
	"dece/internal/domain/common"
	"dece/internal/domain/tracking"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gorm.io/gorm"
)

type TrackingService struct {
	db  *gorm.DB
	ctx context.Context
}

func NewTrackingService(db *gorm.DB) *TrackingService {
	return &TrackingService{db: db}
}

func (s *TrackingService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *TrackingService) ListarLlamados(matriculaID uint) ([]dto.LlamadoResumenDTO, error) {
	var llamados []tracking.LlamadoAtencion

	result := s.db.Where("matricula_id = ?", matriculaID).
		Order("fecha DESC").
		Find(&llamados)

	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]dto.LlamadoResumenDTO, len(llamados))
	for i, l := range llamados {
		estado := "Pendiente Firma"
		if l.RepresentanteFirmo {
			estado = "Firmado / Cerrado"
		}

		response[i] = dto.LlamadoResumenDTO{
			ID:     l.ID,
			Fecha:  l.Fecha,
			Motivo: l.Motivo,
			Medida: l.DetalleSancion.Data.MedidaDisciplinaria,
			Estado: estado,
		}
	}

	return response, nil
}

func (s *TrackingService) ObtenerLlamado(id uint) (*dto.GuardarLlamadoDTO, error) {
	var l tracking.LlamadoAtencion

	if err := s.db.First(&l, id).Error; err != nil {
		return nil, errors.New("Llamado de atención no encontrado")
	}

	datos := &dto.GuardarLlamadoDTO{
		ID:                      l.ID,
		MatriculaID:             l.MatriculaID,
		Fecha:                   l.Fecha,
		Motivo:                  l.Motivo,
		RepresentanteNotificado: l.RepresentanteNotificado,
		RepresentanteFirmo:      l.RepresentanteFirmo,
		MotivoNoFirma:           l.MotivoNoFirma,

		MedidaDisciplinaria:  l.DetalleSancion.Data.MedidaDisciplinaria,
		CumplioMedida:        l.DetalleSancion.Data.CumplioMedida,
		MotivoIncumplimiento: l.DetalleSancion.Data.MotivoIncumplimiento,

		RutaActa:       l.RutaActa,
		RutaResolucion: l.DetalleSancion.Data.RutaResolucion,
	}

	return datos, nil
}

func (s *TrackingService) CrearLlamado(input dto.GuardarLlamadoDTO) (*tracking.LlamadoAtencion, error) {
	var llamado tracking.LlamadoAtencion
	var rutaResolucionPrevia string
	var rutaActaPrevia string

	if input.ID > 0 {
		if err := s.db.First(&llamado, input.ID).Error; err != nil {
			return nil, fmt.Errorf("No se puede editar: el llamado ID %d no existe", input.ID)
		}

		rutaActaPrevia = llamado.RutaActa
		rutaResolucionPrevia = llamado.DetalleSancion.Data.RutaResolucion
	}

	llamado.ID = input.ID
	llamado.MatriculaID = input.MatriculaID
	llamado.Fecha = input.Fecha
	llamado.Motivo = input.Motivo
	llamado.RepresentanteNotificado = input.RepresentanteNotificado
	llamado.RepresentanteFirmo = input.RepresentanteFirmo
	llamado.MotivoNoFirma = input.MotivoNoFirma

	llamado.RutaActa = rutaActaPrevia

	llamado.DetalleSancion = common.JSONMap[tracking.DetalleSancion]{
		Data: tracking.DetalleSancion{
			MedidaDisciplinaria:  input.MedidaDisciplinaria,
			CumplioMedida:        input.CumplioMedida,
			MotivoIncumplimiento: input.MotivoIncumplimiento,

			RutaResolucion: rutaResolucionPrevia,
		},
	}

	if err := s.db.Save(&llamado).Error; err != nil {
		return nil, fmt.Errorf("Error al guardar llamado de atención: %v", err)
	}

	return &llamado, nil
}

func (s *TrackingService) SubirDocumentoDisciplina(llamadoID uint, tipoDoc string, rutaOrigen string) (string, error) {
	var llamado tracking.LlamadoAtencion

	if err := s.db.First(&llamado, llamadoID).Error; err != nil {
		return "", errors.New("Registro disciplinario no encontrado")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("No se pudo acceder a la carpeta del usuario")
	}
	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Discipline")
	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error al crear carpeta: %v", err)
	}

	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".pdf"
	}

	nuevoNombre := fmt.Sprintf("%s_%d_%d%s", tipoDoc, llamado.ID, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	srcFile, err := os.Open(rutaOrigen)
	if err != nil {
		return "", err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(rutaDestinoCompleta)
	if err != nil {
		return "", err
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return "", err
	}

	var rutaAnterior string

	switch tipoDoc {
	case "acta":
		rutaAnterior = llamado.RutaActa
		llamado.RutaActa = rutaDestinoCompleta
	case "resolucion":
		rutaAnterior = llamado.DetalleSancion.Data.RutaResolucion

		datosSancion := llamado.DetalleSancion.Data
		datosSancion.RutaResolucion = rutaDestinoCompleta

		llamado.DetalleSancion.Data = datosSancion
	default:
		return "", errors.New("Tipo de documento inválido (use 'acta' o 'resolucion')")
	}

	if rutaAnterior != "" {
		if _, err := os.Stat(rutaAnterior); err == nil {
			os.Remove(rutaAnterior)
		}
	}

	if err := s.db.Save(&llamado).Error; err != nil {
		return "", fmt.Errorf("Archivo copiado pero error al guardar en BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *TrackingService) SeleccionarArchivo(tipo string) (string, error) {
	var filters []runtime.FileFilter

	if tipo == "pdf" {
		filters = append(filters, runtime.FileFilter{
			DisplayName: "Documentos PDF (*.pdf)",
			Pattern:     "*.pdf",
		})
	} else {
		filters = append(filters, runtime.FileFilter{
			DisplayName: "Imágenes (*.jpg;*.png)",
			Pattern:     "*.jpg;*.jpeg;*.png",
		})
	}

	selection, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title:   "Seleccionar Archivo",
		Filters: filters,
	})

	if err != nil {
		return "", err
	}

	return selection, nil
}

func (s *TrackingService) LeerArchivoParaVista(ruta string) (string, error) {
	if ruta == "" {
		return "", nil
	}

	if _, err := os.Stat(ruta); os.IsNotExist(err) {
		return "", errors.New("El archivo no existe en la ruta especificada")
	}

	bytes, err := os.ReadFile(ruta)
	if err != nil {
		return "", fmt.Errorf("Error al leer el archivo: %v", err)
	}

	mimeType := "application/pdf"
	ext := filepath.Ext(ruta)
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".png":
		mimeType = "image/png"
	}

	base64Str := base64.StdEncoding.EncodeToString(bytes)

	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64Str), nil
}

func (s *TrackingService) BuscarEstudiantesActivos(query string) ([]dto.EstudianteDisciplinaDTO, error) {
	var resultados []dto.EstudianteDisciplinaDTO

	query = "%" + query + "%"

	err := s.db.Table("matriculas").
		Select("estudiantes.id, matriculas.id as matricula_id, estudiantes.cedula, estudiantes.nombres, estudiantes.apellidos, estudiantes.ruta_foto, nivel_educativos.nombre || ' ' || cursos.paralelo as curso").
		Joins("JOIN estudiantes ON estudiantes.id = matriculas.estudiante_id").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Joins("JOIN nivel_educativos ON nivel_educativos.id = cursos.nivel_id").
		Joins("JOIN periodo_lectivos ON periodo_lectivos.id = cursos.periodo_id").
		Where("periodo_lectivos.es_activo = ? AND (estudiantes.cedula LIKE ? OR estudiantes.apellidos LIKE ? OR estudiantes.nombres LIKE ?)", true, query, query, query).
		Limit(20).
		Scan(&resultados).Error

	if err != nil {
		return nil, fmt.Errorf("Error al buscar estudiantes activos: %v", err)
	}

	return resultados, nil
}

func (s *TrackingService) ListarCasos(estudianteID uint) ([]dto.CasoResumenDTO, error) {
	var casos []tracking.CasoSensible

	result := s.db.Where("estudiante_id = ?", estudianteID).
		Order("fecha_deteccion DESC").
		Find(&casos)

	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]dto.CasoResumenDTO, len(casos))
	for i, c := range casos {
		evidencias := c.RutasDocumentos.Data
		if evidencias == nil {
			evidencias = []tracking.Evidencia{}
		}

		evidenciasDTO := make([]dto.EvidenciaDTO, len(evidencias))
		for j, ev := range evidencias {
			evidenciasDTO[j] = dto.EvidenciaDTO{
				Nombre: ev.Nombre,
				Ruta:   ev.Ruta,
			}
		}

		response[i] = dto.CasoResumenDTO{
			ID:                       c.ID,
			CodigoCaso:               c.CodigoCaso,
			TipoCaso:                 c.TipoCaso,
			FechaDeteccion:           c.FechaDeteccion,
			EntidadDerivacion:        c.EntidadDerivacion,
			EntidadDerivacionDetalle: c.EntidadDerivacionDetalle,
			Descripcion:              c.Descripcion,
			Estado:                   c.Estado,
			TotalEvidencias:          len(evidencias),
			RutasEvidencias:          evidenciasDTO,
		}
	}

	return response, nil
}

func (s *TrackingService) ObtenerCaso(id uint) (*dto.GuardarCasoDTO, error) {
	var c tracking.CasoSensible
	if err := s.db.First(&c, id).Error; err != nil {
		return nil, errors.New("Caso no encontrado")
	}

	return &dto.GuardarCasoDTO{
		ID:                       c.ID,
		EstudianteID:             c.EstudianteID,
		TipoCaso:                 c.TipoCaso,
		FechaDeteccion:           c.FechaDeteccion,
		EntidadDerivacion:        c.EntidadDerivacion,
		EntidadDerivacionDetalle: c.EntidadDerivacionDetalle,
		Descripcion:              c.Descripcion,
		Estado:                   c.Estado,
	}, nil
}

func (s *TrackingService) CrearCaso(input dto.GuardarCasoDTO) (*tracking.CasoSensible, error) {
	if input.ID == 0 {
		var periodoActivo academic.PeriodoLectivo
		if err := s.db.Where("es_activo = ?", true).First(&periodoActivo).Error; err != nil {
			return nil, errors.New("No hay un periodo lectivo activo para registrar el caso")
		}

		year := time.Now().Year()
		var count int64
		likeStr := fmt.Sprintf("CASO-%d-%%", year)
		s.db.Model(&tracking.CasoSensible{}).Where("codigo_caso LIKE ?", likeStr).Count(&count)

		input.Estado = "Abierto"

		codigoGenerado := fmt.Sprintf("CASO-%d-%03d", year, count+1)

		caso := tracking.CasoSensible{
			EstudianteID:             input.EstudianteID,
			PeriodoID:                periodoActivo.ID,
			CodigoCaso:               codigoGenerado,
			TipoCaso:                 input.TipoCaso,
			FechaDeteccion:           input.FechaDeteccion,
			EntidadDerivacion:        input.EntidadDerivacion,
			EntidadDerivacionDetalle: input.EntidadDerivacionDetalle,
			Descripcion:              input.Descripcion,
			Estado:                   input.Estado,
			RutasDocumentos:          common.JSONMap[[]tracking.Evidencia]{Data: []tracking.Evidencia{}},
		}

		if err := s.db.Create(&caso).Error; err != nil {
			return nil, err
		}
		return &caso, nil

	} else {
		var caso tracking.CasoSensible
		if err := s.db.First(&caso, input.ID).Error; err != nil {
			return nil, errors.New("Caso no encontrado")
		}

		caso.TipoCaso = input.TipoCaso
		caso.FechaDeteccion = input.FechaDeteccion
		caso.EntidadDerivacion = input.EntidadDerivacion
		caso.EntidadDerivacionDetalle = input.EntidadDerivacionDetalle
		caso.Descripcion = input.Descripcion
		caso.Estado = input.Estado

		if err := s.db.Save(&caso).Error; err != nil {
			return nil, err
		}
		return &caso, nil
	}
}

func (s *TrackingService) SubirEvidenciaCaso(casoID uint, rutaOrigen string, nombre string) (string, error) {
	var caso tracking.CasoSensible

	if err := s.db.First(&caso, casoID).Error; err != nil {
		return "", errors.New("Caso sensible no encontrado")
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("Error de sistema de archivos")
	}

	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Sensitive", caso.CodigoCaso)
	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("Error al crear carpeta segura: %v", err)
	}

	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".pdf"
	}

	safeName := nombre
	if safeName == "" {
		safeName = fmt.Sprintf("EVID_%d", time.Now().UnixMilli())
	}

	replacer := strings.NewReplacer("<", "", ">", "", ":", "", "\"", "", "/", "", "\\", "", "|", "", "?", "", "*", "")
	safeName = replacer.Replace(safeName)

	nuevoNombre := fmt.Sprintf("%s%s", safeName, ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	if _, err := os.Stat(rutaDestinoCompleta); err == nil {
		nuevoNombre = fmt.Sprintf("%s_%d%s", safeName, time.Now().UnixMilli(), ext)
		rutaDestinoCompleta = filepath.Join(destinoDir, nuevoNombre)
	}

	src, err := os.Open(rutaOrigen)
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(rutaDestinoCompleta)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	listaActual := caso.RutasDocumentos.Data
	if listaActual == nil {
		listaActual = []tracking.Evidencia{}
	}

	if nombre == "" {
		nombre = "Evidencia " + fmt.Sprintf("%d", len(listaActual)+1)
	}

	listaActual = append(listaActual, tracking.Evidencia{
		Nombre: nombre,
		Ruta:   rutaDestinoCompleta,
	})

	caso.RutasDocumentos = common.JSONMap[[]tracking.Evidencia]{Data: listaActual}

	if err := s.db.Save(&caso).Error; err != nil {
		return "", fmt.Errorf("Evidencia guardada pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

func (s *TrackingService) EliminarEvidenciaCaso(casoID uint, ruta string) error {
	var caso tracking.CasoSensible

	if err := s.db.First(&caso, casoID).Error; err != nil {
		return errors.New("Caso sensible no encontrado")
	}

	if ruta != "" {
		if _, err := os.Stat(ruta); err == nil {
			if err := os.Remove(ruta); err != nil {
				return fmt.Errorf("No se pudo eliminar el archivo: %v", err)
			}
		}
	}

	listaActual := caso.RutasDocumentos.Data
	if listaActual == nil {
		listaActual = []tracking.Evidencia{}
	}

	nuevaLista := make([]tracking.Evidencia, 0, len(listaActual))
	for _, r := range listaActual {
		if r.Ruta != ruta {
			nuevaLista = append(nuevaLista, r)
		}
	}

	caso.RutasDocumentos = common.JSONMap[[]tracking.Evidencia]{Data: nuevaLista}

	if err := s.db.Save(&caso).Error; err != nil {
		return fmt.Errorf("Error al actualizar BD: %v", err)
	}

	return nil
}
