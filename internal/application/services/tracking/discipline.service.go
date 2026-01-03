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

	// Orden descendente: lo más reciente primero
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
			// Accedemos al campo exacto del JSON mapeado
			Medida: l.DetalleSancion.Data.MedidaDisciplinaria,
			Estado: estado,
		}
	}

	return response, nil
}

func (s *TrackingService) ObtenerLlamado(id uint) (*dto.GuardarLlamadoDTO, error) {
	var l tracking.LlamadoAtencion

	if err := s.db.First(&l, id).Error; err != nil {
		return nil, errors.New("llamado de atención no encontrado")
	}

	// Mapeamos los datos de DB al DTO plano
	datos := &dto.GuardarLlamadoDTO{
		ID:                      l.ID,
		MatriculaID:             l.MatriculaID,
		Fecha:                   l.Fecha,
		Motivo:                  l.Motivo,
		RepresentanteNotificado: l.RepresentanteNotificado,
		RepresentanteFirmo:      l.RepresentanteFirmo,
		MotivoNoFirma:           l.MotivoNoFirma,

		// Extraemos del JSONMap interno
		MedidaDisciplinaria:  l.DetalleSancion.Data.MedidaDisciplinaria,
		CumplioMedida:        l.DetalleSancion.Data.CumplioMedida,
		MotivoIncumplimiento: l.DetalleSancion.Data.MotivoIncumplimiento,

		// --- ASIGNAMOS LAS RUTAS PARA QUE EL FRONTEND PUEDA PREVISUALIZAR ---
		RutaActa:       l.RutaActa,
		RutaResolucion: l.DetalleSancion.Data.RutaResolucion,
	}

	return datos, nil
}

func (s *TrackingService) CrearLlamado(input dto.GuardarLlamadoDTO) (*tracking.LlamadoAtencion, error) {
	var llamado tracking.LlamadoAtencion
	var rutaResolucionPrevia string
	var rutaActaPrevia string

	// 1. EDICIÓN: Recuperar datos previos para preservar rutas de archivos
	if input.ID > 0 {
		if err := s.db.First(&llamado, input.ID).Error; err != nil {
			return nil, fmt.Errorf("no se puede editar: el llamado ID %d no existe", input.ID)
		}
		// Guardamos las rutas que ya existían
		rutaActaPrevia = llamado.RutaActa
		rutaResolucionPrevia = llamado.DetalleSancion.Data.RutaResolucion
	}

	// 2. Mapeo de campos planos
	llamado.ID = input.ID
	llamado.MatriculaID = input.MatriculaID
	llamado.Fecha = input.Fecha
	llamado.Motivo = input.Motivo
	llamado.RepresentanteNotificado = input.RepresentanteNotificado
	llamado.RepresentanteFirmo = input.RepresentanteFirmo
	llamado.MotivoNoFirma = input.MotivoNoFirma

	// Restauramos la ruta del acta (nivel raíz)
	llamado.RutaActa = rutaActaPrevia

	// 3. Mapeo del JSON DetalleSancion (inyectando la ruta preservada)
	llamado.DetalleSancion = common.JSONMap[tracking.DetalleSancion]{
		Data: tracking.DetalleSancion{
			MedidaDisciplinaria:  input.MedidaDisciplinaria,
			CumplioMedida:        input.CumplioMedida,
			MotivoIncumplimiento: input.MotivoIncumplimiento,

			// Aquí inyectamos la ruta que rescatamos de la BD (si existía)
			RutaResolucion: rutaResolucionPrevia,
		},
	}

	// 4. Guardar (Upsert)
	if err := s.db.Save(&llamado).Error; err != nil {
		return nil, fmt.Errorf("error al guardar llamado de atención: %v", err)
	}

	return &llamado, nil
}

func (s *TrackingService) SubirDocumentoDisciplina(llamadoID uint, tipoDoc string, rutaOrigen string) (string, error) {
	var llamado tracking.LlamadoAtencion

	// 1. Buscar registro
	if err := s.db.First(&llamado, llamadoID).Error; err != nil {
		return "", errors.New("registro disciplinario no encontrado")
	}

	// 2. Definir Directorio Seguro
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("no se pudo acceder a la carpeta del usuario")
	}
	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Discipline")
	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("error al crear carpeta: %v", err)
	}

	// 3. Generar Nombre (prefijo dinámico)
	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".pdf"
	}

	// Ej: acta_5_123456.pdf o resolucion_5_123456.pdf
	nuevoNombre := fmt.Sprintf("%s_%d_%d%s", tipoDoc, llamado.ID, time.Now().Unix(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	// 4. Copiar Archivo
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

	// 5. ACTUALIZAR BASE DE DATOS SEGÚN EL TIPO
	var rutaAnterior string

	if tipoDoc == "acta" {
		// A. Caso Acta (Campo en raíz)
		rutaAnterior = llamado.RutaActa
		llamado.RutaActa = rutaDestinoCompleta
	} else if tipoDoc == "resolucion" {
		// B. Caso Resolución (Campo dentro del JSON)
		rutaAnterior = llamado.DetalleSancion.Data.RutaResolucion

		// Actualizamos el dato dentro del struct
		datosSancion := llamado.DetalleSancion.Data
		datosSancion.RutaResolucion = rutaDestinoCompleta

		// Reasignamos al wrapper para que GORM detecte el cambio y lo guarde
		llamado.DetalleSancion.Data = datosSancion
	} else {
		return "", errors.New("tipo de documento inválido (use 'acta' o 'resolucion')")
	}

	// 6. Limpiar archivo antiguo si existía
	if rutaAnterior != "" {
		if _, err := os.Stat(rutaAnterior); err == nil {
			os.Remove(rutaAnterior)
		}
	}

	// 7. Guardar cambios
	if err := s.db.Save(&llamado).Error; err != nil {
		return "", fmt.Errorf("archivo copiado pero error al guardar en BD: %v", err)
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

	// Abre el diálogo usando el contexto de Wails capturado en Startup
	selection, err := runtime.OpenFileDialog(s.ctx, runtime.OpenDialogOptions{
		Title:   "Seleccionar Archivo",
		Filters: filters,
	})

	if err != nil {
		return "", err
	}

	// Retorna la ruta absoluta del archivo seleccionado (o string vacío si canceló)
	return selection, nil
}

func (s *TrackingService) LeerArchivoParaVista(ruta string) (string, error) {
	if ruta == "" {
		return "", nil
	}

	// Verificar si existe
	if _, err := os.Stat(ruta); os.IsNotExist(err) {
		return "", errors.New("el archivo no existe en la ruta especificada")
	}

	// Leer bytes
	bytes, err := os.ReadFile(ruta)
	if err != nil {
		return "", fmt.Errorf("error al leer el archivo: %v", err)
	}

	// Determinar MIME type básico
	mimeType := "application/pdf"
	ext := filepath.Ext(ruta)
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".png":
		mimeType = "image/png"
	}

	// Codificar a Base64
	base64Str := base64.StdEncoding.EncodeToString(bytes)

	// Retornar Data URI completo
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64Str), nil
}

func (s *TrackingService) BuscarEstudiantesActivos(query string) ([]dto.EstudianteDisciplinaDTO, error) {
	// Estructura temporal para recibir los datos de la query cruda o del Join
	var resultados []dto.EstudianteDisciplinaDTO

	query = "%" + query + "%"

	// LÓGICA DEL QUERY:
	// 1. Unimos Matriculas con Cursos, Periodos y Estudiantes.
	// 2. Filtramos donde el Periodo sea ACTIVO (es_activo = true).
	// 3. Filtramos por coincidencia de nombre/cédula.

	err := s.db.Table("matriculas").
		Select("estudiantes.id, matriculas.id as matricula_id, estudiantes.cedula, estudiantes.nombres, estudiantes.apellidos, estudiantes.ruta_foto, nivel_educativos.nombre || ' ' || cursos.paralelo as curso").
		Joins("JOIN estudiantes ON estudiantes.id = matriculas.estudiante_id").
		Joins("JOIN cursos ON cursos.id = matriculas.curso_id").
		Joins("JOIN nivel_educativos ON nivel_educativos.id = cursos.nivel_id").
		Joins("JOIN periodo_lectivos ON periodo_lectivos.id = cursos.periodo_id").
		Where("periodo_lectivos.es_activo = ? AND (estudiantes.cedula LIKE ? OR estudiantes.apellidos LIKE ? OR estudiantes.nombres LIKE ?)", true, query, query, query).
		Limit(20). // Limitamos para no saturar
		Scan(&resultados).Error

	if err != nil {
		return nil, fmt.Errorf("error al buscar estudiantes activos: %v", err)
	}

	return resultados, nil
}

func (s *TrackingService) ListarCasos(estudianteID uint) ([]dto.CasoResumenDTO, error) {
	var casos []tracking.CasoSensible

	// Buscamos por EstudianteID (Historial completo, no solo del año actual)
	result := s.db.Where("estudiante_id = ?", estudianteID).
		Order("fecha_deteccion DESC").
		Find(&casos)

	if result.Error != nil {
		return nil, result.Error
	}

	response := make([]dto.CasoResumenDTO, len(casos))
	for i, c := range casos {
		// Contamos cuántos archivos hay en el array
		evidencias := c.RutasDocumentos.Data
		if evidencias == nil {
			evidencias = []string{}
		}

		response[i] = dto.CasoResumenDTO{
			ID:                c.ID,
			CodigoCaso:        c.CodigoCaso,
			FechaDeteccion:    c.FechaDeteccion,
			EntidadDerivacion: c.EntidadDerivacion,
			Estado:            c.Estado,
			TotalEvidencias:   len(evidencias),
			RutasEvidencias:   evidencias,
		}
	}

	return response, nil
}

func (s *TrackingService) ObtenerCaso(id uint) (*dto.GuardarCasoDTO, error) {
	var c tracking.CasoSensible
	if err := s.db.First(&c, id).Error; err != nil {
		return nil, errors.New("caso no encontrado")
	}

	return &dto.GuardarCasoDTO{
		ID:                c.ID,
		EstudianteID:      c.EstudianteID,
		FechaDeteccion:    c.FechaDeteccion,
		EntidadDerivacion: c.EntidadDerivacion,
		Descripcion:       c.Descripcion,
		Estado:            c.Estado,
	}, nil
}

func (s *TrackingService) CrearCaso(input dto.GuardarCasoDTO) (*tracking.CasoSensible, error) {
	// 1. Validaciones previas
	if input.ID == 0 {
		// Si es nuevo, necesitamos el Periodo Activo
		var periodoActivo academic.PeriodoLectivo
		if err := s.db.Where("es_activo = ?", true).First(&periodoActivo).Error; err != nil {
			return nil, errors.New("no hay un periodo lectivo activo para registrar el caso")
		}

		// 2. Generar Código: CASO-{AÑO}-{SECUENCIAL}
		year := time.Now().Year()
		var count int64
		// Contamos casos de este año para el secuencial
		likeStr := fmt.Sprintf("CASO-%d-%%", year)
		s.db.Model(&tracking.CasoSensible{}).Where("codigo_caso LIKE ?", likeStr).Count(&count)

		input.Estado = "Abierto" // Estado inicial por defecto

		// Ejemplo: CASO-2025-001
		codigoGenerado := fmt.Sprintf("CASO-%d-%03d", year, count+1)

		caso := tracking.CasoSensible{
			EstudianteID:      input.EstudianteID,
			PeriodoID:         periodoActivo.ID,
			CodigoCaso:        codigoGenerado,
			FechaDeteccion:    input.FechaDeteccion,
			EntidadDerivacion: input.EntidadDerivacion,
			Descripcion:       input.Descripcion,
			Estado:            input.Estado,
			// Inicializamos el array vacío para evitar null pointers
			RutasDocumentos: common.JSONMap[[]string]{Data: []string{}},
		}

		if err := s.db.Create(&caso).Error; err != nil {
			return nil, err
		}
		return &caso, nil

	} else {
		// 3. Edición (No cambiamos código ni periodo)
		var caso tracking.CasoSensible
		if err := s.db.First(&caso, input.ID).Error; err != nil {
			return nil, errors.New("caso no encontrado")
		}

		caso.FechaDeteccion = input.FechaDeteccion
		caso.EntidadDerivacion = input.EntidadDerivacion
		caso.Descripcion = input.Descripcion
		caso.Estado = input.Estado

		if err := s.db.Save(&caso).Error; err != nil {
			return nil, err
		}
		return &caso, nil
	}
}

func (s *TrackingService) SubirEvidenciaCaso(casoID uint, rutaOrigen string) (string, error) {
	var caso tracking.CasoSensible

	// 1. Buscar Caso
	if err := s.db.First(&caso, casoID).Error; err != nil {
		return "", errors.New("caso sensible no encontrado")
	}

	// 2. Definir Directorio SEGURO (Sensitive)
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("error de sistema de archivos")
	}
	// Carpeta separada "Sensitive"
	destinoDir := filepath.Join(homeDir, "Documents", "SistemaDECE", "Sensitive", caso.CodigoCaso)
	if err := os.MkdirAll(destinoDir, 0755); err != nil {
		return "", fmt.Errorf("error al crear carpeta segura: %v", err)
	}

	// 3. Generar nombre de archivo
	ext := filepath.Ext(rutaOrigen)
	if ext == "" {
		ext = ".pdf"
	}
	// EVID_{TIMESTAMP}.pdf
	nuevoNombre := fmt.Sprintf("EVID_%d%s", time.Now().UnixMilli(), ext)
	rutaDestinoCompleta := filepath.Join(destinoDir, nuevoNombre)

	// 4. Copiar Archivo
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

	// 5. ACTUALIZAR LISTA JSON EN BASE DE DATOS
	// Obtenemos la lista actual
	listaActual := caso.RutasDocumentos.Data
	if listaActual == nil {
		listaActual = []string{}
	}

	// Agregamos la nueva ruta
	listaActual = append(listaActual, rutaDestinoCompleta)

	// Guardamos de vuelta
	caso.RutasDocumentos = common.JSONMap[[]string]{Data: listaActual}

	if err := s.db.Save(&caso).Error; err != nil {
		return "", fmt.Errorf("evidencia guardada pero error al actualizar BD: %v", err)
	}

	return rutaDestinoCompleta, nil
}

// EliminarEvidenciaCaso elimina un archivo de evidencia del caso y actualiza la lista en BD
func (s *TrackingService) EliminarEvidenciaCaso(casoID uint, ruta string) error {
	var caso tracking.CasoSensible

	// 1. Buscar Caso
	if err := s.db.First(&caso, casoID).Error; err != nil {
		return errors.New("caso sensible no encontrado")
	}

	// 2. Eliminar archivo físico si existe
	if ruta != "" {
		if _, err := os.Stat(ruta); err == nil {
			if err := os.Remove(ruta); err != nil {
				return fmt.Errorf("no se pudo eliminar el archivo: %v", err)
			}
		}
	}

	// 3. Actualizar lista de rutas en la entidad (filtrar la ruta eliminada)
	listaActual := caso.RutasDocumentos.Data
	if listaActual == nil {
		listaActual = []string{}
	}

	nuevaLista := make([]string, 0, len(listaActual))
	for _, r := range listaActual {
		if r != ruta {
			nuevaLista = append(nuevaLista, r)
		}
	}

	caso.RutasDocumentos = common.JSONMap[[]string]{Data: nuevaLista}

	if err := s.db.Save(&caso).Error; err != nil {
		return fmt.Errorf("error al actualizar BD: %v", err)
	}

	return nil
}
